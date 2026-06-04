document.addEventListener('DOMContentLoaded', () => {
    // 1. Bidirectional Sync between Slider and Number Input
    const syncPairs = [
        { numId: 'store_num', sliderId: 'store_slider' },
        { numId: 'dept_num', sliderId: 'dept_slider' },
        { numId: 'size_num', sliderId: 'size_slider' },
        { numId: 'year_num', sliderId: 'year_slider' },
        { numId: 'month_num', sliderId: 'month_slider' },
        { numId: 'week_num', sliderId: 'week_slider' },
        { numId: 'temp_num', sliderId: 'temp_slider' },
        { numId: 'fuel_num', sliderId: 'fuel_slider' },
        { numId: 'cpi_num', sliderId: 'cpi_slider' },
        { numId: 'unemp_num', sliderId: 'unemp_slider' },
        { numId: 'md1_num', sliderId: 'md1_slider' },
        { numId: 'md2_num', sliderId: 'md2_slider' },
        { numId: 'md3_num', sliderId: 'md3_slider' },
        { numId: 'md4_num', sliderId: 'md4_slider' },
        { numId: 'md5_num', sliderId: 'md5_slider' }
    ];

    syncPairs.forEach(pair => {
        const numInput = document.getElementById(pair.numId);
        const sliderInput = document.getElementById(pair.sliderId);

        if (numInput && sliderInput) {
            // Slider updates number input
            sliderInput.addEventListener('input', () => {
                numInput.value = sliderInput.value;
                numInput.dispatchEvent(new Event('change'));
            });

            // Number input updates slider (clamping values)
            numInput.addEventListener('input', () => {
                const min = parseFloat(numInput.min) || 0;
                const max = parseFloat(numInput.max) || Infinity;
                let val = parseFloat(numInput.value);

                if (isNaN(val)) val = min;
                if (val < min) val = min;
                if (val > max) val = max;

                sliderInput.value = val;
            });
        }
    });

    // 2. Holiday Status Checkbox Toggle Sync
    const holidayToggle = document.getElementById('holiday_toggle');
    const holidayHiddenInput = document.getElementById('is_holiday');

    if (holidayToggle && holidayHiddenInput) {
        holidayToggle.addEventListener('change', () => {
            holidayHiddenInput.value = holidayToggle.checked ? '1' : '0';
        });
    }

    // 3. Stage Tabs Navigation
    const tabs = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.tab-pane');
    const nextButtons = document.querySelectorAll('.next-tab');
    const prevButtons = document.querySelectorAll('.prev-tab');
    const dots = document.querySelectorAll('.step-dot');

    const tabOrder = ['tab-store', 'tab-date', 'tab-economy', 'tab-markdown'];

    function switchTab(tabId) {
        tabs.forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        panes.forEach(pane => {
            if (pane.id === tabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        const activeIdx = tabOrder.indexOf(tabId);
        dots.forEach((dot, idx) => {
            if (idx === activeIdx) {
                dot.className = 'step-dot active';
            } else if (idx < activeIdx) {
                dot.className = 'step-dot completed';
            } else {
                dot.className = 'step-dot';
            }
        });
    }

    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    nextButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentPane = e.target.closest('.tab-pane');
            const currentIdx = tabOrder.indexOf(currentPane.id);
            if (currentIdx < tabOrder.length - 1) {
                switchTab(tabOrder[currentIdx + 1]);
            }
        });
    });

    prevButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentPane = e.target.closest('.tab-pane');
            const currentIdx = tabOrder.indexOf(currentPane.id);
            if (currentIdx > 0) {
                switchTab(tabOrder[currentIdx - 1]);
            }
        });
    });

    // 4. Forecast Asynchronous Submission & View Transitions
    const form = document.getElementById('forecast-form');
    const screenInput = document.getElementById('screen-input');
    const screenLoading = document.getElementById('screen-loading');
    const screenOutput = document.getElementById('screen-output');
    const btnBackToInput = document.getElementById('btn-back-to-input');

    const predictionVal = document.getElementById('prediction-value');
    const resultBadge = document.getElementById('result-badge');

    // Summaries fields on results screen
    const sumLocation = document.getElementById('sum-location');
    const sumProfile = document.getElementById('sum-profile');
    const sumTimeline = document.getElementById('sum-timeline');
    const sumWeather = document.getElementById('sum-weather');
    const sumEconomy = document.getElementById('sum-economy');
    const sumMarkdowns = document.getElementById('sum-markdowns');

    // Recommendation slots
    const recStock = document.getElementById('rec-stock');
    const recStaff = document.getElementById('rec-staff');
    const recMarkdown = document.getElementById('rec-markdown');

    // Progress bar visuals
    const valUtilization = document.getElementById('val-utilization');
    const barUtilization = document.getElementById('bar-utilization');
    const valMarkdown = document.getElementById('val-markdown');
    const barMarkdown = document.getElementById('bar-markdown');
    const valMacro = document.getElementById('val-macro');
    const barMacro = document.getElementById('bar-macro');

    // Back to form button
    if (btnBackToInput) {
        btnBackToInput.addEventListener('click', () => {
            screenOutput.style.display = 'none';
            screenInput.style.display = 'block';
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Retrieve current values for the summary card before switching views
        const storeVal = document.getElementById('store_num').value;
        const deptVal = document.getElementById('dept_num').value;
        const typeSelect = document.getElementById('store_type');
        const typeText = typeSelect.options[typeSelect.selectedIndex].text.split(' ')[0];
        const sizeVal = parseFloat(document.getElementById('size_num').value);
        
        const yearVal = document.getElementById('year_num').value;
        const monthVal = document.getElementById('month_num').value;
        const weekVal = document.getElementById('week_num').value;
        const isHoliday = holidayToggle.checked;

        const tempVal = parseFloat(document.getElementById('temp_num').value);
        const fuelVal = parseFloat(document.getElementById('fuel_num').value);
        const cpiVal = parseFloat(document.getElementById('cpi_num').value);
        const unempVal = parseFloat(document.getElementById('unemp_num').value);

        const md1Val = parseFloat(document.getElementById('md1_num').value) || 0;
        const md2Val = parseFloat(document.getElementById('md2_num').value) || 0;
        const md3Val = parseFloat(document.getElementById('md3_num').value) || 0;
        const md4Val = parseFloat(document.getElementById('md4_num').value) || 0;
        const md5Val = parseFloat(document.getElementById('md5_num').value) || 0;
        const markdownSum = md1Val + md2Val + md3Val + md4Val + md5Val;

        // Transition views: Input -> Loading overlay
        screenInput.style.display = 'none';
        screenLoading.style.display = 'flex';
        window.scrollTo({ top: 0 });

        const formData = new FormData(form);

        try {
            // Fetch prediction from server
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Server error code: ${response.status}`);
            }

            const data = await response.json();
            const predictionNum = data.prediction;

            // Compute dynamic analytics metrics for meters
            const sizePct = Math.round((sizeVal / 250000) * 100);
            const mdPct = markdownSum > 0 ? Math.min(Math.round((markdownSum / 35000) * 100), 100) : 0;
            const macroScore = Math.max(0, Math.min(100, Math.round(100 - (unempVal * 5.5) - (Math.abs(tempVal - 68) * 0.4))));

            // Populate summary card fields
            sumLocation.innerText = `Store #${storeVal}, Department #${deptVal}`;
            sumProfile.innerText = `${typeText} Class (${sizeVal.toLocaleString()} sq ft)`;
            sumTimeline.innerText = `Week #${weekVal}, Month #${monthVal}, Year ${yearVal} ${isHoliday ? '[HOLIDAY WEEK]' : ''}`;
            sumWeather.innerText = `${tempVal.toFixed(2)} °F / $${fuelVal.toFixed(3)} per gallon`;
            sumEconomy.innerText = `CPI Index: ${cpiVal.toFixed(3)} / Unemployment: ${unempVal.toFixed(3)}%`;
            sumMarkdowns.innerText = `$${markdownSum.toLocaleString('en-US', { minimumFractionDigits: 2 })} total promotional value`;

            // Populate recommendations based on predicted sales
            if (predictionNum < 15000) {
                recStock.innerText = "Expect lower transaction volumes. Maintain strict replenishment caps and avoid overstocking.";
                recStaff.innerText = "Optimize shifts for off-peak traffic. Minimize active department floor support hours.";
                resultBadge.innerText = 'Low Demand Volume';
                resultBadge.className = 'result-badge low';
            } else if (predictionNum < 50000) {
                recStock.innerText = "Stable demand forecast. Maintain standard safety stock thresholds and normal replenishment lanes.";
                recStaff.innerText = "Schedule standard staff levels. Standard cash registers and floor presence will satisfy traffic.";
                resultBadge.innerText = 'Normal Demand Volume';
                resultBadge.className = 'result-badge normal';
            } else {
                recStock.innerText = "Critical demand peak forecasted! Promptly increase safety inventory stocks by 20-30% to secure shelves.";
                recStaff.innerText = "Schedule auxiliary register operators and maximum support staff to accommodate peak shopper velocity.";
                resultBadge.innerText = 'High Demand Spike';
                resultBadge.className = 'result-badge high';
            }

            // Populate markdown specific recommendation text
            if (markdownSum > 12000) {
                recMarkdown.innerText = `Active promotions ($${markdownSum.toLocaleString()} scale) are in effect. Coordinate shelf space for active campaigns.`;
            } else if (markdownSum > 0) {
                recMarkdown.innerText = `Moderate markdown incentives ($${markdownSum.toLocaleString()}) applied. Monitor category traffic levels.`;
            } else {
                recMarkdown.innerText = "No promotional campaigns are scheduled for this week. Sales rely purely on seasonal demand.";
            }

            // Small delay for smooth futuristic experience
            setTimeout(() => {
                screenLoading.style.display = 'none';
                screenOutput.style.display = 'block';

                // Animate graphical bars
                valUtilization.innerText = `${sizePct}%`;
                barUtilization.style.width = `${sizePct}%`;

                if (mdPct > 70) {
                    valMarkdown.innerText = 'High Leverage';
                    valMarkdown.style.color = '#ec4899';
                } else if (mdPct > 20) {
                    valMarkdown.innerText = 'Moderate';
                    valMarkdown.style.color = '#f59e0b';
                } else {
                    valMarkdown.innerText = 'Low / None';
                    valMarkdown.style.color = '#878584';
                }
                barMarkdown.style.width = `${mdPct || 5}%`;

                if (macroScore > 75) {
                    valMacro.innerText = 'Optimal';
                    valMacro.style.color = '#22c55e';
                } else if (macroScore > 45) {
                    valMacro.innerText = 'Stable';
                    valMacro.style.color = '#f59e0b';
                } else {
                    valMacro.innerText = 'Stress Level';
                    valMacro.style.color = '#ec4899';
                }
                barMacro.style.width = `${macroScore}%`;

                // Fire predicted sales count-up animation
                animateCountUp(predictionNum);

            }, 1000);

        } catch (error) {
            console.error('Error fetching prediction:', error);
            screenLoading.style.display = 'none';
            screenInput.style.display = 'block';
            alert('Calculated forecasting failed. Please verify connection and parameters.');
        }
    });

    // Precision count up animation
    function animateCountUp(targetVal) {
        let currentVal = 0;
        const duration = 1500; // ms
        const steps = 75;
        const stepTime = duration / steps;
        const increment = targetVal / steps;

        let currentStep = 0;

        const interval = setInterval(() => {
            currentVal += increment;
            currentStep++;

            if (currentStep >= steps) {
                clearInterval(interval);
                predictionVal.innerText = `$${targetVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            } else {
                predictionVal.innerText = `$${Math.round(currentVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
        }, stepTime);
    }
});
