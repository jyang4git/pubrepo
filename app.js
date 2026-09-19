document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Inputs & Controls
  const modeForward = document.querySelector('input[value="forward"]');
  const modeReverse = document.querySelector('input[value="reverse"]');
  const labelModeForward = document.getElementById('label-mode-forward');
  const labelModeReverse = document.getElementById('label-mode-reverse');
  const inputCardTitle = document.getElementById('input-card-title');
  
  const focalInput = document.getElementById('focal-input');
  const focalSlider = document.getElementById('focal-slider');
  const presetBtns = document.querySelectorAll('.preset-btn');
  
  // DOM Elements - Calculations & Specs
  const calcValPrimary = document.getElementById('calc-val-primary');
  const calcValStatement = document.getElementById('calc-val-statement');
  const resultPrimaryLabel = document.getElementById('result-primary-label');
  const resultSecondaryLabel = document.getElementById('result-secondary-label');
  const arrowIcon = document.getElementById('arrow-icon');
  
  const specApscAoV = document.getElementById('spec-apsc-aov');
  const specFfAoV = document.getElementById('spec-ff-aov');
  const specClass = document.getElementById('spec-class');

  // Constants
  const CROP_FACTOR = 1.5;
  const FF_DIAGONAL = 43.27; // 36mm x 24mm diagonal
  const APSC_DIAGONAL = 28.84; // 24mm x 16mm diagonal

  // App State
  let state = {
    conversionMode: 'forward', // 'forward' | 'reverse'
    focalLength: 50, // current physical focal length (in mm) or target FF focal length (in mm)
  };

  // Initial updates
  updateUI();

  // Mode Selection Listeners
  modeForward.addEventListener('change', () => handleModeChange('forward'));
  modeReverse.addEventListener('change', () => handleModeChange('reverse'));

  // Sync Slider and Number Input
  focalSlider.addEventListener('input', (e) => {
    state.focalLength = parseInt(e.target.value) || 8;
    focalInput.value = state.focalLength;
    updateUI();
  });

  focalInput.addEventListener('input', (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) return;
    
    // Clamp values
    if (val < 8) val = 8;
    if (val > 400) val = 400;
    
    state.focalLength = val;
    focalSlider.value = val;
    updateUI();
  });

  focalInput.addEventListener('blur', () => {
    // Force field correction on blur
    if (focalInput.value === '' || parseInt(focalInput.value) < 8) {
      state.focalLength = 8;
      focalInput.value = 8;
      focalSlider.value = 8;
    } else if (parseInt(focalInput.value) > 400) {
      state.focalLength = 400;
      focalInput.value = 400;
      focalSlider.value = 400;
    }
    updateUI();
  });

  // Preset Buttons Click Handler
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.val);
      state.focalLength = val;
      focalInput.value = val;
      focalSlider.value = val;
      updateUI();
    });
  });

  // Mode change logic
  function handleModeChange(mode) {
    state.conversionMode = mode;
    
    if (mode === 'forward') {
      labelModeForward.classList.add('active');
      labelModeReverse.classList.remove('active');
      
      inputCardTitle.innerHTML = '<i class="fa-solid fa-calculator"></i> Lens Physical Focal Length';
      resultPrimaryLabel.textContent = 'Equivalent 35mm Focal Length';
      resultSecondaryLabel.textContent = 'Field of View Impact';
      
      arrowIcon.className = "fa-solid fa-circle-arrow-right";
      arrowIcon.style.color = "var(--accent-apsc)";
    } else {
      labelModeReverse.classList.add('active');
      labelModeForward.classList.remove('active');
      
      inputCardTitle.innerHTML = '<i class="fa-solid fa-bullseye"></i> Target Full Frame FOV';
      resultPrimaryLabel.textContent = 'Required Physical Lens';
      resultSecondaryLabel.textContent = 'Lens Needed on APS-C';
      
      arrowIcon.className = "fa-solid fa-circle-arrow-left";
      arrowIcon.style.color = "var(--accent-ff)";
    }
    
    updateUI();
  }

  // Update Calculation Values, HUD and Styles
  function updateUI() {
    const fInput = state.focalLength;
    let fEquivalent = 50;
    let fPhysical = 50;
    
    // 1. Math calculations
    if (state.conversionMode === 'forward') {
      fPhysical = fInput;
      fEquivalent = fPhysical * CROP_FACTOR;
      
      // Update primary calculation
      calcValPrimary.textContent = fEquivalent.toFixed(1);
      calcValPrimary.style.color = 'var(--accent-apsc)';
      calcValPrimary.style.textShadow = '0 0 15px rgba(249, 115, 22, 0.3)';
      
      // Update statement
      calcValStatement.textContent = `Behaves like a ${fEquivalent.toFixed(0)}mm lens on Full Frame. (1.5x narrower crop)`;
    } else {
      fEquivalent = fInput;
      fPhysical = fEquivalent / CROP_FACTOR;
      
      // Update primary calculation
      calcValPrimary.textContent = fPhysical.toFixed(1);
      calcValPrimary.style.color = 'var(--accent-ff)';
      calcValPrimary.style.textShadow = '0 0 15px rgba(99, 102, 241, 0.3)';
      
      // Update statement
      calcValStatement.textContent = `A physical ${fPhysical.toFixed(1)}mm lens is required on your APS-C body.`;
    }

    // 2. Angle of View (AoV) calculations
    // Formula: AoV = 2 * arctan(sensor_dimension / (2 * focal_length))
    const aovFFRad = 2 * Math.atan(FF_DIAGONAL / (2 * fEquivalent));
    const aovFFDeg = aovFFRad * (180 / Math.PI);
    
    const aovAPSCRad = 2 * Math.atan(APSC_DIAGONAL / (2 * fPhysical));
    const aovAPSCDeg = aovAPSCRad * (180 / Math.PI);
    
    specFfAoV.textContent = `${aovFFDeg.toFixed(1)}°`;
    specApscAoV.textContent = `${aovAPSCDeg.toFixed(1)}°`;

    // 3. Classify lens standard (based on Full Frame Equivalent focal length)
    let classification = "Normal Lens";
    if (fEquivalent < 20) {
      classification = "Ultra-Wide Angle";
    } else if (fEquivalent < 35) {
      classification = "Wide Angle";
    } else if (fEquivalent <= 60) {
      classification = "Normal / Standard";
    } else if (fEquivalent <= 105) {
      classification = "Short Telephoto (Portrait)";
    } else if (fEquivalent <= 300) {
      classification = "Telephoto";
    } else {
      classification = "Super Telephoto";
    }
    specClass.textContent = classification;

    // 4. Highlight current preset button in UI
    presetBtns.forEach(btn => {
      const val = parseInt(btn.dataset.val);
      if (val === fInput) {
        btn.classList.add('active');
        if (state.conversionMode === 'forward') {
          btn.style.backgroundColor = 'var(--accent-apsc)';
          btn.style.borderColor = 'var(--accent-apsc)';
        } else {
          btn.style.backgroundColor = 'var(--accent-ff)';
          btn.style.borderColor = 'var(--accent-ff)';
        }
      } else {
        btn.classList.remove('active');
        btn.removeAttribute('style');
      }
    });
  }
});
