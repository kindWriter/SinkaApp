function generateTimeSlots() {
    const container = document.getElementById('timeSlots');
    container.innerHTML = '';
    
    if (!selectedDate) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDateObj = new Date(selectedDate);
    const isToday = selectedDateObj.getTime() === today.getTime();

    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const day = selectedDateObj.getDay(); // 0 = воскресенье

    let start, end;
    if (day === 0) { // Вс
        start = 10; end = 16;
    } else if (day === 6) { // Сб
        start = 10; end = 18;
    } else { // Пн–Пт
        start = 9; end = 20;
    }

    const slots = [];
    for (let h = start; h < end; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
        slots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    // Фильтрация: если сегодня — убрать прошедшие слоты
    const filteredSlots = isToday
        ? slots.filter(slot => {
            const [slotH, slotM] = slot.split(':').map(Number);
            if (slotH < currentHours) return false;
            if (slotH === currentHours && slotM <= currentMinutes) return false;
            return true;
        })
        : slots;

    if (filteredSlots.length === 0 && isToday) {
        container.innerHTML = '<div style="color: var(--neon-yellow); text-align: center; padding: 20px;">Нет доступных слотов на сегодня</div>';
        return;
    }

    filteredSlots.forEach(slot => {
        const btn = document.createElement('div');
        btn.className = 'time-slot';
        btn.textContent = slot;
        btn.onclick = () => {
            document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
            btn.classList.add('selected');
            selectedTime = slot;
        };
        container.appendChild(btn);
    });
}
