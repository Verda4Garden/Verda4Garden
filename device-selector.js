document.addEventListener('DOMContentLoaded', () => {
    const styleLink = document.getElementById('main-stylesheet');
    const deviceChoiceModal = document.getElementById('device-choice-modal');
    const mobileButton = document.getElementById('choice-mobile');
    const computerButton = document.getElementById('choice-computer');
    const switchViewBtn = document.getElementById('switch-view-btn');

    let currentDevice = localStorage.getItem('deviceType');

    function setStylesheet(device) {
        if (device === 'mobile') {
            styleLink.setAttribute('href', 'mobile.css');
            if(switchViewBtn) switchViewBtn.innerHTML = '<i class="fas fa-desktop"></i> Ubah ke Tampilan Komputer';
        } else {
            styleLink.setAttribute('href', 'style.css');
            if(switchViewBtn) switchViewBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Ubah ke Tampilan Mobile';
        }
        localStorage.setItem('deviceType', device);
        if (deviceChoiceModal) deviceChoiceModal.style.display = 'none';
        currentDevice = device;
        // Re-render products to apply the correct click logic
        if (typeof renderAllProducts === 'function') {
            renderAllProducts();
        }
    }

    if (currentDevice) {
        setStylesheet(currentDevice);
    } else if (deviceChoiceModal) {
        deviceChoiceModal.style.display = 'flex';
    }

    if (mobileButton) mobileButton.addEventListener('click', () => setStylesheet('mobile'));
    if (computerButton) computerButton.addEventListener('click', () => setStylesheet('computer'));

    if (switchViewBtn) {
        switchViewBtn.addEventListener('click', () => {
            const newDevice = currentDevice === 'mobile' ? 'computer' : 'mobile';
            setStylesheet(newDevice);
        });
    }
});