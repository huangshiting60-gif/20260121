document.addEventListener('DOMContentLoaded', () => {
    const courseList = document.getElementById('course-list');
    const addBtn = document.getElementById('add-btn');
    const calcBtn = document.getElementById('calc-btn');
    const clearBtn = document.getElementById('clear-btn');
    const resultCard = document.getElementById('result');
    const exportBtn = document.getElementById('export-btn');
    const calcTargetBtn = document.getElementById('calc-target-btn');
    let myChart = null; // 用於儲存圖表實例

    // 初始化：載入儲存的資料
    loadData();

    // 事件監聽
    addBtn.addEventListener('click', () => {
        addCourseRow();
        saveData();
    });
    calcBtn.addEventListener('click', calculateResults);
    clearBtn.addEventListener('click', clearAllData);
    exportBtn.addEventListener('click', exportResult);
    calcTargetBtn.addEventListener('click', calculateTarget);
    // 監聽輸入變更以自動儲存
    courseList.addEventListener('input', saveData);

    // 功能：新增課程輸入列
    function addCourseRow(name = '', category = '必修', credit = '', score = '') {
        const row = document.createElement('div');
        row.className = 'course-row';
        row.innerHTML = `
            <input type="text" placeholder="課程名稱">
            <select>
                <option value="必修">必修</option>
                <option value="選修">選修</option>
                <option value="通識">通識</option>
                <option value="體育">體育</option>
                <option value="其他">其他</option>
            </select>
            <input type="number" class="credit" placeholder="學分" min="0" step="1">
            <input type="number" class="score" placeholder="分數" min="0" max="100">
            <button class="btn danger">×</button>
        `;
        
        // 填入資料
        const inputs = row.querySelectorAll('input');
        const select = row.querySelector('select');
        inputs[0].value = name;
        select.value = category;
        inputs[1].value = credit;
        inputs[2].value = score;

        // 綁定刪除按鈕事件
        row.querySelector('.btn.danger').addEventListener('click', () => {
            row.remove();
            saveData();
        });

        courseList.appendChild(row);
    }

    // 功能：計算成績
    function calculateResults() {
        const rows = document.querySelectorAll('.course-row');
        let totalCredits = 0;
        let weightedScoreSum = 0; // 分數 * 學分 的總和
        let weightedGPASum = 0;   // GPA積點 * 學分 的總和
        
        // 分類統計物件
        const categoryStats = {};

        rows.forEach(row => {
            const creditInput = row.querySelector('.credit');
            const scoreInput = row.querySelector('.score');
            const category = row.querySelector('select').value;

            const credit = parseFloat(creditInput.value);
            const score = parseFloat(scoreInput.value);

            // 簡單驗證：確保有輸入數值
            if (isNaN(credit) || isNaN(score)) {
                // 如果是空行則忽略，或者可以提示使用者
                return; 
            }

            // 累加計算
            totalCredits += credit;
            weightedScoreSum += (score * credit);
            const gpa = getGPA(score);
            weightedGPASum += (gpa * credit);

            // 分類計算
            if (!categoryStats[category]) {
                categoryStats[category] = { credits: 0, weightedScore: 0, weightedGPA: 0 };
            }
            categoryStats[category].credits += credit;
            categoryStats[category].weightedScore += (score * credit);
            categoryStats[category].weightedGPA += (gpa * credit);
        });

        if (totalCredits === 0) {
            alert("請輸入有效的學分與分數！");
            return;
        }

        // 計算最終結果
        const finalAverage = weightedScoreSum / totalCredits;
        const finalGPA = weightedGPASum / totalCredits;

        // 顯示結果
        document.getElementById('total-credits').textContent = totalCredits;
        document.getElementById('average-score').textContent = finalAverage.toFixed(2);
        document.getElementById('gpa-score').textContent = finalGPA.toFixed(2);
        document.getElementById('average-grade').textContent = getGrade(finalAverage);

        // 顯示分類統計
        const detailsDiv = document.getElementById('category-details');
        detailsDiv.innerHTML = '<h3>分類統計</h3>';
        const chartLabels = [];
        const chartData = [];
        for (const [cat, stats] of Object.entries(categoryStats)) {
            if (stats.credits > 0) {
                const catAvg = (stats.weightedScore / stats.credits).toFixed(2);
                const catGPA = (stats.weightedGPA / stats.credits).toFixed(2);
                const p = document.createElement('p');
                p.style.fontSize = '0.95rem';
                p.style.margin = '5px 0';
                p.innerHTML = `${cat}: 平均 <b>${catAvg}</b> / GPA <b>${catGPA}</b>`;
                detailsDiv.appendChild(p);
                
                // 收集圖表資料
                chartLabels.push(cat);
                chartData.push(stats.credits);
            }
        }
        renderChart(chartLabels, chartData);
        
        resultCard.classList.remove('hidden');
    }

    // 功能：將分數轉換為 GPA 積點 (常見的 4.0 制)
    // 你可以根據學校標準修改這裡
    function getGPA(score) {
        if (score >= 80) return 4.0;
        if (score >= 70) return 3.0;
        if (score >= 60) return 2.0;
        if (score >= 50) return 1.0; // 視學校規定，有些學校不及格即為 0
        return 0;
    }

    // 功能：根據平均分數計算等級
    function getGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'A-';
        if (score >= 77) return 'B+';
        if (score >= 73) return 'B';
        if (score >= 70) return 'B-';
        if (score >= 67) return 'C+';
        if (score >= 63) return 'C';
        if (score >= 60) return 'C-';
        if (score >= 50) return 'D';
        return 'F';
    }

    // 功能：儲存資料到 localStorage
    function saveData() {
        const rows = document.querySelectorAll('.course-row');
        const data = [];
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            const select = row.querySelector('select');
            data.push({
                name: inputs[0].value,
                category: select.value,
                credit: inputs[1].value,
                score: inputs[2].value
            });
        });
        localStorage.setItem('gpaData', JSON.stringify(data));
    }

    // 功能：從 localStorage 載入資料
    function loadData() {
        const saved = localStorage.getItem('gpaData');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.length > 0) {
                data.forEach(item => addCourseRow(item.name, item.category, item.credit, item.score));
                return;
            }
        }
        addCourseRow(); // 若無資料則新增一列預設
    }

    // 功能：清除所有資料
    function clearAllData() {
        if (confirm('確定要清除所有課程資料嗎？')) {
            courseList.innerHTML = ''; // 清空列表
            localStorage.removeItem('gpaData'); // 清除儲存
            addCourseRow(); // 恢復預設的一列
            
            // 重置結果顯示
            resultCard.classList.add('hidden');
            document.getElementById('total-credits').textContent = '0';
            document.getElementById('average-score').textContent = '0.00';
            document.getElementById('gpa-score').textContent = '0.00';
            document.getElementById('average-grade').textContent = '-';
            document.getElementById('category-details').innerHTML = '';
            if (myChart) {
                myChart.destroy();
                myChart = null;
            }
        }
    }

    // 功能：匯出結果為圖片
    function exportResult() {
        // 隱藏匯出按鈕，避免截圖包含按鈕
        exportBtn.style.display = 'none';
        
        html2canvas(document.querySelector('.container')).then(canvas => {
            const link = document.createElement('a');
            link.download = 'GPA_Result.png';
            link.href = canvas.toDataURL();
            link.click();
            // 恢復顯示按鈕
            exportBtn.style.display = '';
        });
    }

    // 功能：繪製圓餅圖
    function renderChart(labels, data) {
        const ctx = document.getElementById('creditChart').getContext('2d');
        
        if (myChart) {
            myChart.destroy();
        }

        myChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#333' } },
                    title: { display: true, text: '各類別學分比例', color: '#333', font: { size: 16 } }
                }
            }
        });
    }

    // 功能：計算目標 GPA 需求
    function calculateTarget() {
        // 1. 取得目前成績狀態
        const rows = document.querySelectorAll('.course-row');
        let currentCredits = 0;
        let currentWeightedGPA = 0;

        rows.forEach(row => {
            const credit = parseFloat(row.querySelector('.credit').value);
            const score = parseFloat(row.querySelector('.score').value);
            if (!isNaN(credit) && !isNaN(score)) {
                currentCredits += credit;
                currentWeightedGPA += (getGPA(score) * credit);
            }
        });

        if (currentCredits === 0) {
            alert("請先在上方輸入目前的課程成績，才能進行預測！");
            return;
        }

        const currentGPA = currentWeightedGPA / currentCredits;

        // 2. 取得目標輸入
        const targetGPA = parseFloat(document.getElementById('target-gpa').value);
        const plannedCredits = parseFloat(document.getElementById('planned-credits').value);
        const resultDiv = document.getElementById('target-result');

        if (isNaN(targetGPA)) {
            alert("請輸入目標 GPA");
            return;
        }

        let message = "";

        // 情境 A: 使用者輸入了預計學分 -> 計算需要的 GPA
        if (!isNaN(plannedCredits) && plannedCredits > 0) {
            // 公式: (目前積分 + 需求積分) / (目前學分 + 預計學分) = 目標GPA
            const requiredGPA = (targetGPA * (currentCredits + plannedCredits) - currentWeightedGPA) / plannedCredits;
            
            message += `<p>若下學期修 <strong>${plannedCredits}</strong> 學分，你需要平均 GPA <strong>${requiredGPA.toFixed(2)}</strong> 才能達到目標。</p>`;
            
            if (requiredGPA > 4.0) message += `<p style="color: #e74c3c;">⚠️ 這超過了 4.0 上限，除非重修舊課，否則無法達成。</p>`;
            else if (requiredGPA < 0) message += `<p style="color: #27ae60;">🎉 你的目標已經達成了！</p>`;
        }

        // 情境 B: 計算需要多少 4.0 學分才能拉到目標 (僅當目標 > 目前)
        if (targetGPA > currentGPA) {
            if (targetGPA >= 4.0) {
                 message += `<p>⚠️ 數學上無法透過修新課將平均拉至 4.0 (極限值)。</p>`;
            } else {
                const neededCredits = (targetGPA * currentCredits - currentWeightedGPA) / (4.0 - targetGPA);
                message += `<p>若接下來每科都拿滿分 (4.0)，還需要約 <strong>${Math.ceil(neededCredits)}</strong> 學分才能達到目標。</p>`;
            }
        } else if (targetGPA < currentGPA && isNaN(plannedCredits)) {
             message += `<p>你的目前 GPA (${currentGPA.toFixed(2)}) 已經高於目標了！</p>`;
        }

        resultDiv.innerHTML = message;
        resultDiv.classList.remove('hidden');
    }
});