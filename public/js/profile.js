let isEditing = false;

document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    initPhotoUpload();
});

async function loadProfileData() {
    try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
            window.location.href = "login.html";
            return;
        }
        const data = await res.json();
        if (data.success && data.user) {
            const u = data.user;
            const values = document.querySelectorAll(".info-row .value");
            
            // Заполняем текстовые данные
            values[0].textContent = u.full_name || '';
            values[1].textContent = u.login || '';
            values[2].textContent = u.email || '';
            values[3].textContent = u.phone || '';

            // Подгружаем фото, если оно есть в БД
            if (u.photo) {
                document.querySelector('.profile-photo img').src = u.photo + '?t=' + Date.now();
            }
        }
    } catch (err) {
        console.error("Ошибка загрузки:", err);
    }
}

function initPhotoUpload() {
    const photoBtn = document.querySelector('.upload-photo-btn');
    if (!photoBtn) return;

    photoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';

        fileInput.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('photo', file);

            try {
                const response = await fetch('/api/profile/upload-photo', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (result.success) {
                    document.querySelector('.profile-photo img').src = result.photo + '?t=' + Date.now();
                    alert('✅ Фото успешно обновлено');
                } else {
                    alert('❌ Ошибка: ' + result.message);
                }
            } catch (err) {
                alert('Ошибка сервера при загрузке фото');
            }
        };
        fileInput.click();
    });
}

const editBtn = document.querySelector('.edit-btn');
const saveBtn = document.querySelector('.save-btn');

// Настройка кнопок
if (saveBtn) {
    saveBtn.style.opacity = "0.5";
    saveBtn.style.pointerEvents = "none";
}

if (editBtn) {
    editBtn.addEventListener('click', () => {
        if (isEditing) return;
        isEditing = true;

        const valueSpans = document.querySelectorAll('.info-row .value');
        
        valueSpans.forEach((span, index) => {
            const currentVal = span.textContent.trim();
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentVal;
            input.className = 'edit-input-active';
            input.style.cursor = 'text'; 
            input.style.position = 'relative';
            input.style.zIndex = '100';

            span.innerHTML = '';
            span.appendChild(input);

            if (index === 0) {
                setTimeout(() => {
                    input.focus();
                    input.setSelectionRange(input.value.length, input.value.length);
                }, 50);
            }
        });

        editBtn.style.opacity = "0.5";
        editBtn.style.pointerEvents = "none";
        saveBtn.style.opacity = "1";
        saveBtn.style.pointerEvents = "auto";
    });
}

if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
        if (!isEditing) return;

        const inputs = document.querySelectorAll('.edit-input-active');
        const updatedData = {
            full_name: inputs[0].value.trim(),
            login: inputs[1].value.trim(),
            email: inputs[2].value.trim(),
            phone: inputs[3].value.trim()
        };

        try {
            const response = await fetch('/api/profile/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            
            const result = await response.json();

            if (result.success) {
                const valueSpans = document.querySelectorAll('.info-row .value');
                valueSpans.forEach((span, i) => {
                    span.textContent = Object.values(updatedData)[i];
                });

                isEditing = false;
                editBtn.style.opacity = "1";
                editBtn.style.pointerEvents = "auto";
                saveBtn.style.opacity = "0.5";
                saveBtn.style.pointerEvents = "none";
                alert('✅ Данные успешно сохранены!');
            } else {
                alert('❌ ' + result.message);
            }
        } catch (err) {
            console.error('Ошибка сохранения:', err);
            alert('Ошибка при сохранении данных');
        }
    });
}