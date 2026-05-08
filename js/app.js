// ===== Состояния =====
let currentStage = 1;
let currentSlide = 0;
const totalSlides = 4;
let selectedCard = 0;
let userImageSrc = null;
let currentPath = 'ai';
let positionOpen = false;
let positionValue = '';
let currentTemplateSrc = null;

// ===== Навигация =====
function goToStage(step) {
    if (step === 2) syncStage2Preview();
    if (step === 3) renderFinalCard();

    document.querySelectorAll('.stage').forEach(el => el.classList.remove('active'));
    document.getElementById('stage' + step).classList.add('active');

    for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById('prog' + i);
    const line = document.getElementById('progLine' + i);
    dot.classList.remove('active', 'done');
    if (line) line.classList.remove('done');
    if (i < step) { dot.classList.add('done'); if (line) line.classList.add('done'); }
    else if (i === step) dot.classList.add('active');
    }

    document.getElementById('stepBadge').textContent = `Этап ${step}`;
    const titles = { 1: 'Выбор картинки', 2: 'Ввод текста', 3: 'Сохранение открытки' };
    document.getElementById('pageTitle').textContent = titles[step];
    currentStage = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Карусель =====
const track = document.getElementById('carouselTrack');

function updateCarousel() {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
      
    document.querySelectorAll('.slider-dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
    for (let i = 0; i < 4; i++) {
    document.getElementById('thumb' + i).classList.toggle('active', i === currentSlide);
    document.querySelectorAll('.variant-btn')[i].classList.toggle('active', i === selectedCard);
    document.getElementById('cardPreview' + i).classList.toggle('selected', i === selectedCard);
    }
}

function goToSlide(index) { if (index >= 0 && index < totalSlides) { currentSlide = index; updateCarousel(); } }
function moveSlide(dir) { goToSlide(currentSlide + dir); }

// ===== Выбор карточки =====
function selectCard(index) {
    selectedCard = index;
    currentSlide = index;

    const cardEl = document.getElementById('cardPreview' + index);
    const imgEl = cardEl?.querySelector('.template-img');
    currentTemplateSrc = imgEl ? imgEl.src : null;
    
    updateCarousel();
    showToast(`Выбран вариант ${index + 1}`);
}


// Свайпы
const viewport = document.querySelector('.carousel-viewport');
let touchStartX = 0, isSwiping = false;
    
viewport.addEventListener('touchstart', e => { 
    touchStartX = e.touches[0].clientX; 
    isSwiping = true; 
}, { passive: true });
    
viewport.addEventListener('touchend', e => {
    if (!isSwiping) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { 
    if (diff > 0) moveSlide(1); 
    else moveSlide(-1); 
    }
    isSwiping = false;
}, { passive: true });

// Загрузка изображения
document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(ev) {
    userImageSrc = ev.target.result;
    document.getElementById('userImage').src = userImageSrc;
    document.getElementById('userImage').style.display = 'block';
    document.getElementById('uploadPlaceholder').style.display = 'none';
    document.getElementById('removeImageBtn').classList.add('visible');
    document.getElementById('sberLogo4').style.display = 'block';
    selectCard(3);
    showToast('Изображение загружено!');
  };
  reader.readAsDataURL(file);
});

// Функция удаления изображения
function removeUserImage(event) {
  event.stopPropagation(); // Чтобы не срабатывал клик по карточке
  
  userImageSrc = null;
  document.getElementById('userImage').style.display = 'none';
  document.getElementById('uploadPlaceholder').style.display = 'flex';
  document.getElementById('removeImageBtn').classList.remove('visible');
  document.getElementById('sberLogo4').style.display = 'none';
  
  // Сброс input file
  const fileInput = document.getElementById('fileInput');
  fileInput.value = '';
  
  showToast('Изображение удалено');
}

// ===== Синхронизация превью =====
function syncStage2Preview() {
    const liveTemplateImg = document.getElementById('liveTemplateImg');
    const liveUserImg = document.getElementById('liveUserImg');

    if (selectedCard === 3 && userImageSrc) {
        liveTemplateImg.style.display = 'none';
        liveUserImg.src = userImageSrc;
        liveUserImg.style.display = 'block';
    } else {
        liveUserImg.style.display = 'none';
        liveTemplateImg.style.display = 'block';
        liveTemplateImg.src = currentTemplateSrc;
    }
}

// ===== Выбор способа =====
function selectPath(path) {
    currentPath = path;
    document.getElementById('pathAi').classList.toggle('active', path === 'ai');
    document.getElementById('pathManual').classList.toggle('active', path === 'manual');
    document.getElementById('constructorPanel').classList.toggle('visible', path === 'ai');
    document.getElementById('manualPanel').classList.toggle('visible', path === 'manual');
}

function toggleCollapse(id) { document.getElementById(id).classList.toggle('open'); }

function generatePrompt() {
    const btn = document.getElementById('btnGenerate');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="display:inline-block;width:14px;height:14px;border-width:2px;margin-right:8px;"></span> Генерация...';
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const style = document.querySelector('input[name="style"]:checked').value;
    const position = document.getElementById('inputPosition').value;
    const genderText = gender === 'male' ? 'мужчина' : 'женщина';
    const styleText = style === 'soulful' ? 'душевное, тёплое' : 'официальное, деловое';
    let prompt = `Создай текст поздравления с днём рождения.\nПолучатель: ${genderText}`;
    if (position) prompt += `, должность: ${position}`;
    prompt += `.\nСтиль: ${styleText}.\nОбъём: не более 200 символов, включая пробелы.\nФормат: текст для поля <p1> в открытке.\nНе используй эмодзи.`;
    setTimeout(() => {
    btn.disabled = false;
    btn.textContent = 'Создать промт';
    document.getElementById('promptOutput').style.display = 'block';
    document.getElementById('promptText').textContent = prompt;
    showToast('Промт создан!');
    }, 1000);
}

function copyPrompt() {
    navigator.clipboard.writeText(document.getElementById('promptText').textContent).then(() => {
    const btn = document.getElementById('btnCopy');
    btn.textContent = 'Скопировано!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Скопировать'; btn.classList.remove('copied'); }, 2000);
    showToast('Промт скопирован');
    });
}

// Самостоятельный ввод
function syncField(field, input) {
    const liveEl = document.getElementById('live' + field.charAt(0).toUpperCase() + field.slice(1));
    if (liveEl) liveEl.value = input.value;
    const len = input.value.length, max = input.maxLength;
    const countEl = document.getElementById('char' + field.charAt(0).toUpperCase() + field.slice(1));
    if (countEl) { countEl.textContent = `${len} / ${max}`; countEl.classList.toggle('warn', len >= max); }
    input.classList.toggle('char-warn', len >= max);
}
function updateLiveField(field, input) {
    const fieldEl = document.getElementById('field' + field.charAt(0).toUpperCase() + field.slice(1));
    if (fieldEl) fieldEl.value = input.value;
    const len = input.value.length, max = input.maxLength;
    const countEl = document.getElementById('char' + field.charAt(0).toUpperCase() + field.slice(1));
    if (countEl) { countEl.textContent = `${len} / ${max}`; countEl.classList.toggle('warn', len >= max); }
}
    
function updateToggleField(type, value) {
  if (type === 'position') {
    console.log('Position:', value);
  }
}

// ===== Скачивание и рендер =====
function renderFinalCard() {
    const finalTemplateImg = document.getElementById('finalTemplateImg');
    const finalUserImg = document.getElementById('finalUserImg');
      
    if (selectedCard === 3 && userImageSrc) {
        finalTemplateImg.style.display = 'none';
        finalUserImg.src = userImageSrc;
        finalUserImg.style.display = 'block';
    } else {
        finalUserImg.style.display = 'none';
        finalTemplateImg.style.display = 'block';
        finalTemplateImg.src = currentTemplateSrc;
    }

    const h1 = document.getElementById('fieldH1')?.value;
    const p0 = document.getElementById('fieldP0')?.value;
    const p1 = document.getElementById('fieldP1')?.value;
    const footer = document.getElementById('fieldFooter')?.value;

    document.getElementById('finalH1').textContent = h1;
    document.getElementById('finalP0').textContent = p0;
    document.getElementById('finalP1').textContent = p1;
    document.getElementById('finalFooter').textContent = footer;
}

async function downloadCard(format) {
    const card = document.getElementById('finalCard');
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'flex';
    try {
    const canvas = await html2canvas(card, { scale: 2, useCORS: true, logging: false, backgroundColor: null });
    const link = document.createElement('a');
    if (format === 'jpg') { link.download = 'openka_sber.jpg'; link.href = canvas.toDataURL('image/jpeg', 0.9); }
    else { link.download = 'openka_sber.png'; link.href = canvas.toDataURL('image/png'); }
    link.click();
    showToast('Открытка сохранена!');
    } catch (err) { showToast('Ошибка при создании картинки'); console.error(err); }
    finally { overlay.style.display = 'none'; }
}

// ===== Попап toast =====
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

// Инициализация
updateCarousel();
