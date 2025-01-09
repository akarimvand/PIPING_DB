document.addEventListener("DOMContentLoaded", function() {
    const welderSelect = document.getElementById('welderSelect');
    const welderInfoCard = document.getElementById('welderInfoCard');
    const welderName = document.getElementById('welderName');
    const welderNationalCode = document.getElementById('welderNationalCode');
    const welderCardsContainer = document.getElementById('welderCardsContainer');
    let weldersData = [];

    // خواندن داده‌ها از فایل متنی
    fetch('https://raw.githubusercontent.com/akarimvand/PIPING_DB/refs/heads/MAIN_PIPING/data.txt')
        .then(response => response.text())
        .then(data => {
            const rows = data.split('\n');
            const headers = rows[0].split(',');

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].split(',');
                const welder = {};
                for (let j = 0; j < headers.length; j++) {
                    welder[headers[j]] = row[j];
                }
                weldersData.push(welder);
            }

            // پر کردن کومبو باکس
            const uniqueWelders = [...new Set(weldersData.map(w => w.WELDER))];
            uniqueWelders.forEach(welder => {
                const option = document.createElement('option');
                option.value = welder;
                option.textContent = welder;
                welderSelect.appendChild(option);
            });
        })
        .catch(error => console.error('خطا در خواندن فایل:', error));

    // رویداد تغییر انتخاب
    welderSelect.addEventListener('change', function() {
        const selectedWelder = this.value;
        const welderRecords = weldersData.filter(w => w.WELDER === selectedWelder);

        // پاک کردن کارت‌های قبلی
        welderCardsContainer.innerHTML = '';

        if (welderRecords.length > 0) {
            const firstRecord = welderRecords[0];
            const welderFullName = `${firstRecord.First_Name} ${firstRecord.Last_Name}`;
            const nationalCode = firstRecord.National_Code;

            // نمایش اطلاعات جوشکار در کارت مجزا
            welderName.textContent = `نام و نام خانوادگی: ${welderFullName}`;
            welderNationalCode.textContent = `کد ملی: ${nationalCode}`;
            welderInfoCard.style.display = 'block';

            // گروه‌بندی رکوردها بر اساس BASE_METAL
            const groupedByBaseMetal = welderRecords.reduce((acc, record) => {
                const baseMetal = record.BASE_METAL;
                if (!acc[baseMetal]) {
                    acc[baseMetal] = [];
                }
                acc[baseMetal].push(record);
                return acc;
            }, {});

            // ایجاد کارت برای هر BASE_METAL
            for (const baseMetal in groupedByBaseMetal) {
                const records = groupedByBaseMetal[baseMetal];
                const shootQty = records.reduce((sum, record) => sum + (parseInt(record['Shoot(QTY)']) || 0), 0);
                const repairQty = records.reduce((sum, record) => sum + (parseInt(record.Repair_Qty) || 0), 0);
                const repairPercentage = (repairQty / shootQty) * 100 || 0;

                // ایجاد کارت
                const card = document.createElement('div');
                card.className = 'col-md-6 mb-4';
                card.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${baseMetal}</h5>
                            <p class="card-text">
                                <strong>Welded(QTY):</strong> ${records.reduce((sum, record) => sum + (parseInt(record['Welded(QTY)']) || 0), 0)}<br>
                                <strong>Selected(QTY):</strong> ${records.reduce((sum, record) => sum + (parseInt(record['Selected(QTY)']) || 0), 0)}<br>
                                <strong>Shoot(QTY):</strong> ${shootQty}<br>
                                <strong>Acc_(QTY):</strong> ${records.reduce((sum, record) => sum + (parseInt(record['Acc_(QTY)']) || 0), 0)}<br>
                                <strong>Repair_Qty:</strong> ${repairQty}<br>
                                <strong>درصد تعمیرات:</strong> ${repairPercentage.toFixed(2)}%
                            </p>
                            ${repairPercentage > 5 ? '<div class="alert alert-danger">درصد خطای این جوشکار بالای 5 است و باید به آن هشدار داده شود.</div>' : ''}
                            <canvas id="chart-${baseMetal}"></canvas>
                        </div>
                    </div>
                `;
                welderCardsContainer.appendChild(card);

                // ایجاد نمودار pie
                const chartCtx = document.getElementById(`chart-${baseMetal}`).getContext('2d');
                new Chart(chartCtx, {
                    type: 'pie',
                    data: {
                        labels: ['تعمیرات', 'سایر'],
                        datasets: [{
                            data: [repairPercentage, 100 - repairPercentage],
                            backgroundColor: [
                                `hsl(${Math.random() * 360}, 70%, 50%)`, // رنگ تصادفی برای تعمیرات
                                `hsl(${Math.random() * 360}, 70%, 50%)`  // رنگ تصادفی برای سایر
                            ]
                        }]
                    }
                });
            }
        }
    });
});