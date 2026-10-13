document.addEventListener('DOMContentLoaded', () => {
  // Sensor Format Specifications
  const SENSORS = {
    'apsc-1.5': {
      id: 'apsc-1.5',
      name: 'APS-C (Sony, Nikon DX, Fuji X)',
      short: 'APS-C (1.5x)',
      crop: 1.5,
      diagonal: 28.84, // 24mm x 16mm
      coc: 0.020 // mm circle of confusion
    },
    'apsc-canon': {
      id: 'apsc-canon',
      name: 'Canon APS-C (RF-S / EF-S)',
      short: 'Canon APS-C (1.6x)',
      crop: 1.6,
      diagonal: 26.82, // 22.3mm x 14.9mm
      coc: 0.019 // mm
    },
    'm43': {
      id: 'm43',
      name: 'Micro Four Thirds (M4/3)',
      short: 'Micro 4/3 (2.0x)',
      crop: 2.0,
      diagonal: 21.63, // 17.3mm x 13mm
      coc: 0.015 // mm
    },
    '1inch': {
      id: '1inch',
      name: '1-inch Sensor',
      short: '1-inch (2.7x)',
      crop: 2.7,
      diagonal: 15.86, // 13.2mm x 8.8mm
      coc: 0.011 // mm
    }
  };

  const FF_DIAGONAL = 43.27; // 36mm x 24mm
  const FF_COC = 0.030; // 35mm full frame circle of confusion

  // App State
  let state = {
    conversionMode: 'forward', // 'forward' | 'reverse'
    sensorKey: 'apsc-1.5',
    focalLength: 50, // in mm
    aperture: 1.8, // f-number
    distanceMeters: 2.0, // in meters
    distanceUnit: 'm' // 'm' | 'ft'
  };

  // DOM Elements - Sensor & Mode
  const sensorPillBtns = document.querySelectorAll('.sensor-pill');
  const headerCropBadge = document.getElementById('header-crop-badge');
  const modeForward = document.querySelector('input[value="forward"]');
  const modeReverse = document.querySelector('input[value="reverse"]');
  const labelModeForward = document.getElementById('label-mode-forward');
  const labelModeReverse = document.getElementById('label-mode-reverse');

  // DOM Elements - Focal Length
  const inputCardTitle = document.getElementById('input-card-title');
  const focalInput = document.getElementById('focal-input');
  const focalSlider = document.getElementById('focal-slider');
  const focalPresetBtns = document.querySelectorAll('.focal-presets .preset-btn');

  // DOM Elements - Aperture
  const apertureCardTitle = document.getElementById('aperture-card-title');
  const apertureInput = document.getElementById('aperture-input');
  const apertureSlider = document.getElementById('aperture-slider');
  const aperturePresetBtns = document.querySelectorAll('.aperture-btn');

  // DOM Elements - Subject Distance
  const distanceInput = document.getElementById('distance-input');
  const distanceSlider = document.getElementById('distance-slider');
  const distanceUnitLabel = document.getElementById('distance-unit-label');
  const distanceTicks = document.getElementById('distance-ticks');
  const unitMBtn = document.getElementById('unit-m');
  const unitFtBtn = document.getElementById('unit-ft');
  const distancePresetBtns = document.querySelectorAll('.distance-btn');

  // DOM Elements - Results & Equivalence
  const calcComboTag = document.getElementById('calc-combo-tag');
  const calcValPrimary = document.getElementById('calc-val-primary');
  const calcValAperture = document.getElementById('calc-val-aperture');
  const resultPrimaryLabel = document.getElementById('result-primary-label');
  const resultSecondaryLabel = document.getElementById('result-secondary-label');
  const focalEquivSub = document.getElementById('focal-equiv-sub');
  const apertureEquivSub = document.getElementById('aperture-equiv-sub');
  const arrowIcon = document.getElementById('arrow-icon');
  const calcValStatement = document.getElementById('calc-val-statement');
  const calcExposureNote = document.getElementById('calc-exposure-note');

  // DOM Elements - DoF Visualizer
  const dofTotalVal = document.getElementById('dof-total-val');
  const dofNearVal = document.getElementById('dof-near-val');
  const dofFocusVal = document.getElementById('dof-focus-val');
  const dofFarVal = document.getElementById('dof-far-val');
  const dofSharpZone = document.getElementById('dof-sharp-zone');
  const dofSubjectMarker = document.getElementById('dof-subject-marker');
  const distFrontBar = document.getElementById('dist-front-bar');
  const distBackBar = document.getElementById('dist-back-bar');
  const distFrontText = document.getElementById('dist-front-text');
  const distBackText = document.getElementById('dist-back-text');

  // DOM Elements - Specs Table
  const specCrop = document.getElementById('spec-crop');
  const specPupil = document.getElementById('spec-pupil');
  const specTotalDof = document.getElementById('spec-total-dof');
  const specHyperfocal = document.getElementById('spec-hyperfocal');
  const specNear = document.getElementById('spec-near');
  const specFar = document.getElementById('spec-far');
  const specApscAoV = document.getElementById('spec-apsc-aov');
  const specFfAoV = document.getElementById('spec-ff-aov');
  const specClass = document.getElementById('spec-class');
  const specCoc = document.getElementById('spec-coc');

  // Initial Calculation Run
  updateUI();

  // -------------------------------------------------------------
  // EVENT LISTENERS
  // -------------------------------------------------------------

  // Sensor selection
  sensorPillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sensorKey = btn.dataset.sensor;
      if (!SENSORS[sensorKey]) return;
      
      state.sensorKey = sensorKey;
      sensorPillBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const currentSensor = SENSORS[sensorKey];
      headerCropBadge.innerHTML = `<i class="fa-solid fa-microchip"></i> Crop Factor: ${currentSensor.crop}x (${currentSensor.short})`;
      updateUI();
    });
  });

  // Mode Selection
  modeForward.addEventListener('change', () => handleModeChange('forward'));
  modeReverse.addEventListener('change', () => handleModeChange('reverse'));

  function handleModeChange(mode) {
    state.conversionMode = mode;
    
    if (mode === 'forward') {
      labelModeForward.classList.add('active');
      labelModeReverse.classList.remove('active');
      
      inputCardTitle.innerHTML = '<i class="fa-solid fa-calculator"></i> Lens Physical Focal Length';
      apertureCardTitle.innerHTML = '<i class="fa-solid fa-camera"></i> Lens Physical Aperture';
      resultPrimaryLabel.textContent = 'Equivalent 35mm Focal Length';
      resultSecondaryLabel.textContent = 'Equivalent Depth of Field (Aperture)';
      focalEquivSub.textContent = 'Framing / Field of View';
      apertureEquivSub.textContent = 'Background Blur & Bokeh Match';
      
      arrowIcon.className = "fa-solid fa-circle-arrow-right";
      arrowIcon.style.color = "var(--accent-apsc)";
    } else {
      labelModeReverse.classList.add('active');
      labelModeForward.classList.remove('active');
      
      inputCardTitle.innerHTML = '<i class="fa-solid fa-bullseye"></i> Target Full Frame Focal Length';
      apertureCardTitle.innerHTML = '<i class="fa-solid fa-bullseye"></i> Target Full Frame Aperture';
      resultPrimaryLabel.textContent = 'Required Physical Focal Length';
      resultSecondaryLabel.textContent = 'Required Physical Aperture';
      focalEquivSub.textContent = 'Physical Lens on Crop Body';
      apertureEquivSub.textContent = 'Aperture needed to match FF blur';
      
      arrowIcon.className = "fa-solid fa-circle-arrow-left";
      arrowIcon.style.color = "var(--accent-ff)";
    }
    
    updateUI();
  }

  // Focal Length Input & Slider Sync
  focalSlider.addEventListener('input', (e) => {
    state.focalLength = parseInt(e.target.value) || 8;
    focalInput.value = state.focalLength;
    updateUI();
  });

  focalInput.addEventListener('input', (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) return;
    if (val < 8) val = 8;
    if (val > 400) val = 400;
    state.focalLength = val;
    focalSlider.value = val;
    updateUI();
  });

  focalInput.addEventListener('blur', () => {
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

  // Focal Presets
  focalPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.val);
      state.focalLength = val;
      focalInput.value = val;
      focalSlider.value = val;
      updateUI();
    });
  });

  // Aperture Input & Slider Sync
  apertureSlider.addEventListener('input', (e) => {
    state.aperture = parseFloat(e.target.value) || 1.8;
    apertureInput.value = state.aperture.toFixed(1);
    updateUI();
  });

  apertureInput.addEventListener('input', (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    if (val < 0.95) val = 0.95;
    if (val > 22) val = 22;
    state.aperture = Math.round(val * 10) / 10;
    apertureSlider.value = state.aperture;
    updateUI();
  });

  apertureInput.addEventListener('blur', () => {
    if (apertureInput.value === '' || parseFloat(apertureInput.value) < 0.95) {
      state.aperture = 0.95;
    } else if (parseFloat(apertureInput.value) > 22) {
      state.aperture = 22;
    }
    apertureInput.value = state.aperture.toFixed(1);
    apertureSlider.value = state.aperture;
    updateUI();
  });

  // Aperture Presets
  aperturePresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseFloat(btn.dataset.aperture);
      state.aperture = val;
      apertureInput.value = val.toFixed(1);
      apertureSlider.value = val;
      updateUI();
    });
  });

  // Distance Input & Slider Sync
  distanceSlider.addEventListener('input', (e) => {
    const rawVal = parseFloat(e.target.value) || 2.0;
    if (state.distanceUnit === 'm') {
      state.distanceMeters = rawVal;
      distanceInput.value = rawVal.toFixed(1);
    } else {
      // slider in feet
      const feet = rawVal;
      state.distanceMeters = feet / 3.28084;
      distanceInput.value = feet.toFixed(1);
    }
    updateUI();
  });

  distanceInput.addEventListener('input', (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    if (val < 0.2) val = 0.2;
    
    if (state.distanceUnit === 'm') {
      state.distanceMeters = val;
      distanceSlider.value = Math.min(val, 25);
    } else {
      state.distanceMeters = val / 3.28084;
      distanceSlider.value = Math.min(val, 80);
    }
    updateUI();
  });

  // Distance Presets
  distancePresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const meters = parseFloat(btn.dataset.dist);
      state.distanceMeters = meters;
      if (state.distanceUnit === 'm') {
        distanceInput.value = meters.toFixed(1);
        distanceSlider.value = meters;
      } else {
        const feet = meters * 3.28084;
        distanceInput.value = feet.toFixed(1);
        distanceSlider.value = feet;
      }
      updateUI();
    });
  });

  // Unit Toggle (Meters vs Feet)
  unitMBtn.addEventListener('click', () => {
    if (state.distanceUnit === 'm') return;
    state.distanceUnit = 'm';
    unitMBtn.classList.add('active');
    unitFtBtn.classList.remove('active');
    distanceUnitLabel.textContent = 'm';
    
    // update slider range for meters
    distanceSlider.min = 0.3;
    distanceSlider.max = 25;
    distanceSlider.step = 0.1;
    distanceSlider.value = Math.min(state.distanceMeters, 25);
    distanceInput.value = state.distanceMeters.toFixed(1);
    
    distanceTicks.innerHTML = `
      <span>0.5m</span>
      <span>1.5m</span>
      <span>2.5m</span>
      <span>5m</span>
      <span>10m</span>
      <span>25m</span>
    `;
    updateUI();
  });

  unitFtBtn.addEventListener('click', () => {
    if (state.distanceUnit === 'ft') return;
    state.distanceUnit = 'ft';
    unitFtBtn.classList.add('active');
    unitMBtn.classList.remove('active');
    distanceUnitLabel.textContent = 'ft';
    
    // update slider range for feet
    distanceSlider.min = 1.0;
    distanceSlider.max = 80;
    distanceSlider.step = 0.5;
    const feet = state.distanceMeters * 3.28084;
    distanceSlider.value = Math.min(feet, 80);
    distanceInput.value = feet.toFixed(1);
    
    distanceTicks.innerHTML = `
      <span>1.5ft</span>
      <span>5ft</span>
      <span>8ft</span>
      <span>16ft</span>
      <span>30ft</span>
      <span>80ft</span>
    `;
    updateUI();
  });

  // -------------------------------------------------------------
  // CORE COMPUTATIONS & UI UPDATE
  // -------------------------------------------------------------

  function updateUI() {
    const currentSensor = SENSORS[state.sensorKey] || SENSORS['apsc-1.5'];
    const cropFactor = currentSensor.crop;
    const sensorCoC = currentSensor.coc; // mm
    const sensorDiag = currentSensor.diagonal; // mm

    const fInput = state.focalLength;
    const nInput = state.aperture;
    const distMeters = Math.max(state.distanceMeters, 0.1);
    const distMm = distMeters * 1000;

    let fPhysical = 50;
    let fEquivalent = 75;
    let nPhysical = 1.8;
    let nEquivalent = 2.7;

    // 1. Equivalence Math
    if (state.conversionMode === 'forward') {
      // Physical Crop Lens -> Full Frame Equivalent
      fPhysical = fInput;
      nPhysical = nInput;
      fEquivalent = fPhysical * cropFactor;
      nEquivalent = nPhysical * cropFactor;

      // Update primary calculation display
      calcValPrimary.textContent = fEquivalent.toFixed(1);
      calcValPrimary.style.color = 'var(--accent-apsc)';
      calcValPrimary.style.textShadow = '0 0 16px rgba(249, 115, 22, 0.35)';

      calcValAperture.textContent = nEquivalent.toFixed(1);

      calcComboTag.textContent = `${fPhysical}mm f/${nPhysical.toFixed(1)} ➔ ${fEquivalent.toFixed(1)}mm f/${nEquivalent.toFixed(1)}`;

      calcValStatement.textContent = `A ${fPhysical}mm f/${nPhysical.toFixed(1)} lens on ${currentSensor.short} behaves exactly like a ${fEquivalent.toFixed(1)}mm f/${nEquivalent.toFixed(1)} lens on Full Frame for field of view and depth of field / bokeh blur.`;

      calcExposureNote.innerHTML = `<i class="fa-solid fa-circle-info"></i> <strong>Exposure Note:</strong> While depth of field equals <strong>f/${nEquivalent.toFixed(1)}</strong>, the light transmission per unit area remains <strong>f/${nPhysical.toFixed(1)}</strong>. Set your camera's shutter speed and ISO using standard f/${nPhysical.toFixed(1)} exposure meter readings.`;

    } else {
      // Target Full Frame Look -> Required Physical Crop Gear
      fEquivalent = fInput;
      nEquivalent = nInput;
      fPhysical = fEquivalent / cropFactor;
      nPhysical = nEquivalent / cropFactor;

      // Update primary calculation display
      calcValPrimary.textContent = fPhysical.toFixed(1);
      calcValPrimary.style.color = 'var(--accent-ff)';
      calcValPrimary.style.textShadow = '0 0 16px rgba(99, 102, 241, 0.35)';

      calcValAperture.textContent = nPhysical.toFixed(1);

      calcComboTag.textContent = `Target ${fEquivalent}mm f/${nEquivalent.toFixed(1)} ➔ Need ${fPhysical.toFixed(1)}mm f/${nPhysical.toFixed(1)}`;

      calcValStatement.textContent = `To match a Full Frame ${fEquivalent}mm f/${nEquivalent.toFixed(1)} look, you need a physical ${fPhysical.toFixed(1)}mm lens shooting at f/${nPhysical.toFixed(1)} on your ${currentSensor.short} body.`;

      calcExposureNote.innerHTML = `<i class="fa-solid fa-circle-info"></i> <strong>Exposure Note:</strong> To obtain the equivalent shallow depth of field of an f/${nEquivalent.toFixed(1)} Full Frame setup, your physical crop lens must be fast enough to shoot at <strong>f/${nPhysical.toFixed(1)}</strong>.`;
    }

    // 2. Physical Entrance Pupil Diameter (mm)
    // D = f / N
    const entrancePupilMm = fPhysical / nPhysical;
    specPupil.textContent = `${entrancePupilMm.toFixed(1)} mm`;

    // 3. Angle of View (AoV) calculations
    // Formula: AoV = 2 * arctan(sensor_diagonal / (2 * focal_length))
    const aovFFRad = 2 * Math.atan(FF_DIAGONAL / (2 * fEquivalent));
    const aovFFDeg = aovFFRad * (180 / Math.PI);
    
    const aovSensorRad = 2 * Math.atan(sensorDiag / (2 * fPhysical));
    const aovSensorDeg = aovSensorRad * (180 / Math.PI);
    
    specFfAoV.textContent = `${aovFFDeg.toFixed(1)}°`;
    specApscAoV.textContent = `${aovSensorDeg.toFixed(1)}°`;

    // 4. Exact Depth of Field Calculations (Based on the physical crop camera setup)
    // Hyperfocal distance H (mm) = (f^2 / (N * c)) + f
    const hyperfocalMm = (Math.pow(fPhysical, 2) / (nPhysical * sensorCoC)) + fPhysical;
    const hyperfocalMeters = hyperfocalMm / 1000;

    // Near Limit D_near (mm) = (H * d) / (H + (d - f))
    const nearLimitMm = (hyperfocalMm * distMm) / (hyperfocalMm + (distMm - fPhysical));
    const nearLimitMeters = Math.max(0, nearLimitMm / 1000);

    // Far Limit D_far (mm) = (H * d) / (H - (d - f))
    let farLimitMeters = Infinity;
    const denom = hyperfocalMm - (distMm - fPhysical);
    if (distMm < hyperfocalMm && denom > 0) {
      const farLimitMm = (hyperfocalMm * distMm) / denom;
      farLimitMeters = farLimitMm / 1000;
    } else {
      farLimitMeters = Infinity;
    }

    // Total DoF
    let totalDofMeters = Infinity;
    if (farLimitMeters !== Infinity) {
      totalDofMeters = farLimitMeters - nearLimitMeters;
    }

    // 5. Update Specs Grid Values
    specCrop.textContent = `${cropFactor.toFixed(2)}x`;
    specCoc.textContent = `${sensorCoC.toFixed(3)} mm`;
    specHyperfocal.textContent = formatDistance(hyperfocalMeters);
    specNear.textContent = formatDistance(nearLimitMeters);
    specFar.textContent = farLimitMeters === Infinity ? 'Infinity (∞)' : formatDistance(farLimitMeters);
    specTotalDof.textContent = formatDoF(totalDofMeters);

    // 6. Update DoF Visualizer Elements
    dofTotalVal.textContent = formatDoF(totalDofMeters);
    dofNearVal.textContent = formatDistance(nearLimitMeters);
    dofFocusVal.textContent = formatDistance(distMeters);
    dofFarVal.textContent = farLimitMeters === Infinity ? 'Infinity (∞)' : formatDistance(farLimitMeters);

    // Distribution calculation (front vs back)
    if (farLimitMeters === Infinity) {
      distFrontBar.style.width = '35%';
      distBackBar.style.width = '65%';
      distFrontText.textContent = 'To Hyperfocal';
      distBackText.textContent = 'To Infinity (∞)';
    } else if (totalDofMeters > 0) {
      const frontDist = distMeters - nearLimitMeters;
      const backDist = farLimitMeters - distMeters;
      const frontPct = Math.max(10, Math.min(90, Math.round((frontDist / totalDofMeters) * 100)));
      const backPct = 100 - frontPct;
      distFrontBar.style.width = `${frontPct}%`;
      distBackBar.style.width = `${backPct}%`;
      distFrontText.textContent = `${frontPct}% In Front`;
      distBackText.textContent = `${backPct}% Behind`;
    }

    // Visualizer In-Focus Zone Bar Width & Subject Marker Position
    if (farLimitMeters === Infinity) {
      dofSharpZone.style.flex = '3';
      dofSubjectMarker.style.left = '35%';
    } else {
      // Calculate realistic visual proportion
      // Ratio of DoF to subject distance
      const dofRatio = totalDofMeters / distMeters;
      // Clamp flex factor between 0.35 and 4.0 for pleasant aesthetics
      const flexVal = Math.max(0.35, Math.min(4.0, dofRatio * 2.5 + 0.6));
      dofSharpZone.style.flex = flexVal.toFixed(2);
      
      const frontPart = distMeters - nearLimitMeters;
      const subjPosPct = Math.max(25, Math.min(75, Math.round((frontPart / totalDofMeters) * 100)));
      dofSubjectMarker.style.left = `${subjPosPct}%`;
    }

    // 7. Lens Standard Classification (based on Full Frame Equivalent focal length)
    let classification = "Normal Lens";
    if (fEquivalent < 18) {
      classification = "Ultra-Wide Angle";
    } else if (fEquivalent < 24) {
      classification = "Ultra-Wide / Landscape";
    } else if (fEquivalent < 35) {
      classification = "Wide Angle (Street/Reportage)";
    } else if (fEquivalent <= 60) {
      classification = "Standard / Normal (Natural FOV)";
    } else if (fEquivalent <= 105) {
      classification = "Short Telephoto (Portrait Prime)";
    } else if (fEquivalent <= 200) {
      classification = "Telephoto";
    } else if (fEquivalent <= 300) {
      classification = "Super Telephoto (Wildlife/Sports)";
    } else {
      classification = "Extreme Super Telephoto";
    }
    specClass.textContent = classification;

    // 8. Highlight Active Preset Buttons in UI
    highlightPresets(fInput, nInput, distMeters);
  }

  // -------------------------------------------------------------
  // HELPER FORMATTING FUNCTIONS
  // -------------------------------------------------------------

  function formatDistance(meters) {
    if (meters === Infinity) return 'Infinity (∞)';
    if (state.distanceUnit === 'm') {
      if (meters < 1) {
        return `${(meters * 100).toFixed(1)} cm`;
      }
      return `${meters.toFixed(2)} m`;
    } else {
      const feet = meters * 3.28084;
      if (feet < 1) {
        return `${(feet * 12).toFixed(1)} in`;
      }
      return `${feet.toFixed(2)} ft`;
    }
  }

  function formatDoF(meters) {
    if (meters === Infinity) return 'Infinity (∞)';
    if (state.distanceUnit === 'm') {
      if (meters < 0.01) {
        return `${(meters * 1000).toFixed(1)} mm`;
      } else if (meters < 1) {
        return `${(meters * 100).toFixed(1)} cm`;
      }
      return `${meters.toFixed(2)} m`;
    } else {
      const feet = meters * 3.28084;
      const inches = feet * 12;
      if (inches < 12) {
        return `${inches.toFixed(1)} in`;
      }
      return `${feet.toFixed(2)} ft`;
    }
  }

  function highlightPresets(fVal, nVal, distMeters) {
    // Focal length presets
    focalPresetBtns.forEach(btn => {
      const val = parseInt(btn.dataset.val);
      if (val === fVal) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Aperture presets
    aperturePresetBtns.forEach(btn => {
      const val = parseFloat(btn.dataset.aperture);
      if (Math.abs(val - nVal) < 0.05) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Distance presets
    distancePresetBtns.forEach(btn => {
      const val = parseFloat(btn.dataset.dist);
      if (Math.abs(val - distMeters) < 0.15) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

});
