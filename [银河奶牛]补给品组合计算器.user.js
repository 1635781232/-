// ==UserScript==
// @name         [银河奶牛]补给品组合计算器
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  计算补给品的搭配性价比，找出最佳回血/回蓝组合。支持左买(买入价)、右买(卖出价)和平均价格的性价比分析，可自定义最低恢复量需求。
// @author       银河奶牛
// @license      CC-BY-NC-SA-4.0
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @match        https://www.milkywayidlecn.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.2/math.js
// @homepage     https://github.com/1635781232/
// @homepageURL  https://github.com/1635781232/
// @source       https://github.com/1635781232/-/blob/main/%5B%E9%93%B6%E6%B2%B3%E5%A5%B6%E7%89%9B%5D%E8%A1%A5%E7%BB%99%E5%93%81%E7%BB%84%E5%90%88%E8%AE%A1%E7%AE%97%E5%99%A8.user.js
// @downloadURL  https://github.com/1635781232/-/blob/main/%5B%E9%93%B6%E6%B2%B3%E5%A5%B6%E7%89%9B%5D%E8%A1%A5%E7%BB%99%E5%93%81%E7%BB%84%E5%90%88%E8%AE%A1%E7%AE%97%E5%99%A8.user.js
// @updateURL    https://github.com/1635781232/-/blob/main/%5B%E9%93%B6%E6%B2%B3%E5%A5%B6%E7%89%9B%5D%E8%A1%A5%E7%BB%99%E5%93%81%E7%BB%84%E5%90%88%E8%AE%A1%E7%AE%97%E5%99%A8.user.js
// @supportURL   https://github.com/1635781232/
// @run-at       document-end
// ==/UserScript==

/*
[银河奶牛]补给品组合计算器 v1.2

功能说明：
1. 支持回蓝(MP)和回血(HP)两种类型的补给品计算
2. 计算左买(买入价)、右买(卖出价)和平均价格的性价比
3. 可自定义最低恢复量需求
4. 自动排序显示市场价格和成本分析
5. 界面可拖动、调整大小、最小化
6. 30分钟缓存市场数据，减少API请求

恢复物品：
- 回蓝(MP)：软糖系列、酸奶系列
- 回血(HP)：甜甜圈系列、蛋糕系列

使用方法：
1. 选择恢复类型（回蓝/回血）
2. 输入最低恢复量需求
3. 点击"更新市场数据"按钮获取最新价格
4. 查看最佳搭配建议

版本历史：
v1.0 - 初始版本，支持回蓝物品计算
v1.1 - 添加左买/右买计算，支持最低回蓝量设置
v1.2 - 添加回血物品计算，优化界面显示

GitHub仓库：https://github.com/1635781232/
*/

(() => {
    "use strict";

    // 恢复能力数据
    const restoreData = {
        // MP恢复物品
        gummies: {
            "gummy": 40,
            "apple_gummy": 80,
            "orange_gummy": 120,
            "plum_gummy": 160,
            "peach_gummy": 200,
            "dragon_fruit_gummy": 240,
            "star_fruit_gummy": 280
        },
        yogurts: {
            "yogurt": 50,
            "apple_yogurt": 100,
            "orange_yogurt": 150,
            "plum_yogurt": 200,
            "peach_yogurt": 250,
            "dragon_fruit_yogurt": 300,
            "star_fruit_yogurt": 350
        },
        // HP恢复物品
        donuts: {
            "donut": 40,
            "blueberry_donut": 80,
            "blackberry_donut": 120,
            "strawberry_donut": 160,
            "mooberry_donut": 200,
            "marsberry_donut": 240,
            "spaceberry_donut": 280
        },
        cakes: {
            "cupcake": 50,
            "blueberry_cake": 100,
            "blackberry_cake": 150,
            "strawberry_cake": 200,
            "mooberry_cake": 250,
            "marsberry_cake": 300,
            "spaceberry_cake": 350
        }
    };

    // 物品名称映射
    const itemNames = {
        // MP恢复
        "gummy": "软糖",
        "apple_gummy": "苹果软糖",
        "orange_gummy": "橙子软糖",
        "plum_gummy": "李子软糖",
        "peach_gummy": "桃子软糖",
        "dragon_fruit_gummy": "火龙果软糖",
        "star_fruit_gummy": "杨桃软糖",
        "yogurt": "酸奶",
        "apple_yogurt": "苹果酸奶",
        "orange_yogurt": "橙子酸奶",
        "plum_yogurt": "李子酸奶",
        "peach_yogurt": "桃子酸奶",
        "dragon_fruit_yogurt": "火龙果酸奶",
        "star_fruit_yogurt": "杨桃酸奶",
        // HP恢复
        "donut": "甜甜圈",
        "blueberry_donut": "蓝莓甜甜圈",
        "blackberry_donut": "黑莓甜甜圈",
        "strawberry_donut": "草莓甜甜圈",
        "mooberry_donut": "哞莓甜甜圈",
        "marsberry_donut": "火星莓甜甜圈",
        "spaceberry_donut": "太空莓甜甜圈",
        "cupcake": "纸杯蛋糕",
        "blueberry_cake": "蓝莓蛋糕",
        "blackberry_cake": "黑莓蛋糕",
        "strawberry_cake": "草莓蛋糕",
        "mooberry_cake": "哞莓蛋糕",
        "marsberry_cake": "火星莓蛋糕",
        "spaceberry_cake": "太空莓蛋糕"
    };

    // 市场API URL
    const MARKET_API_URL = window.location.href.includes("milkywayidle.com")
        ? "https://www.milkywayidle.com/game_data/marketplace.json"
        : window.location.href.includes("milkywayidlecn.com")
        ? "https://www.milkywayidlecn.com/game_data/marketplace.json"
        : "https://www.milkywayidle.com/game_data/marketplace.json";

    // 缓存市场数据
    let marketData = null;
    let lastUpdateTime = 0;
    const CACHE_DURATION = 30 * 60 * 1000; // 30分钟

    // 添加样式
    GM_addStyle(`
        .consumable-optimizer {
            position: fixed;
            top: 50px;
            right: 20px;
            width: 420px;
            min-width: 300px;
            min-height: 100px;
            max-height: 90vh;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            border: 1px solid #444;
            border-radius: 8px;
            z-index: 9999;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            resize: both;
            overflow: hidden;
        }
        .consumable-optimizer.minimized {
            width: auto !important;
            height: auto !important;
            min-height: auto;
            resize: none;
        }
        .consumable-optimizer.minimized .optimizer-body {
            display: none;
        }
        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background: rgba(76, 175, 80, 0.2);
            cursor: move;
            user-select: none;
            border-bottom: 1px solid #444;
        }
        .consumable-optimizer.minimized .panel-header {
            border-bottom: none;
        }
        .panel-header h3 {
            margin: 0;
            color: #4CAF50;
            font-size: 14px;
        }
        .panel-controls {
            display: flex;
            gap: 8px;
        }
        .panel-btn {
            width: 20px;
            height: 20px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }
        .panel-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        .panel-btn.minimize-btn:hover {
            background: rgba(255, 193, 7, 0.5);
        }
        .optimizer-body {
            padding: 15px;
            overflow-y: auto;
            flex: 1;
        }
        .consumable-optimizer h5 {
            margin: 5px 0;
            color: #fff;
            font-size: 13px;
        }
        .optimizer-section {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #444;
        }
        .optimizer-section:last-child {
            border-bottom: none;
        }
        .item-row {
            display: grid;
            grid-template-columns: 100px 100px 100px 100px;
            gap: 10px;
            padding: 4px 0;
            border-bottom: 1px solid #333;
            font-size: 12px;
        }
        .item-row:last-child {
            border-bottom: none;
        }
        .item-name {
            font-weight: bold;
            color: #aaa;
        }
        .item-value {
            text-align: right;
            color: #fff;
        }
        .best-combo .item-row {
            grid-template-columns: 100px 1fr;
        }
        .collapsible .collapse-header {
            cursor: pointer;
            user-select: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .collapsible .collapse-header:hover {
            color: #4CAF50;
        }
        .collapsible .collapse-icon {
            font-size: 10px;
            transition: transform 0.2s;
        }
        .collapsible.collapsed .collapse-icon {
            transform: rotate(-90deg);
        }
        .collapsible .collapse-content {
            max-height: 500px;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }
        .collapsible.collapsed .collapse-content {
            max-height: 0;
        }
        .combo-group {
            margin-bottom: 10px;
            padding: 8px;
            border-radius: 5px;
        }
        .combo-group.highlight-left {
            background: rgba(76, 175, 80, 0.15);
            border-left: 3px solid #4CAF50;
        }
        .combo-group.highlight-right {
            background: rgba(244, 67, 54, 0.15);
            border-left: 3px solid #F44336;
        }
        .combo-group.highlight-avg {
            background: rgba(255, 193, 7, 0.15);
            border-left: 3px solid #FFC107;
        }
        .best-combo {
            background: transparent;
            padding: 5px 0;
            border-radius: 0;
            margin-top: 0;
        }
        .update-btn {
            width: 100%;
            padding: 8px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
        .update-btn:hover {
            background: #45a049;
        }
        .loading {
            text-align: center;
            color: #999;
            padding: 10px;
        }
        .restore-input-group {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .restore-input-group label {
            color: #aaa;
            font-size: 13px;
        }
        .restore-input {
            width: 120px;
            padding: 5px 8px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid #555;
            border-radius: 4px;
            color: #fff;
            font-size: 13px;
            text-align: right;
        }
        .restore-input:focus {
            outline: none;
            border-color: #4CAF50;
        }
        .restore-input::placeholder {
            color: #666;
        }
        .restore-select {
            width: 120px;
            padding: 5px 8px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid #555;
            border-radius: 4px;
            color: #fff;
            font-size: 13px;
            cursor: pointer;
        }
        .restore-select:focus {
            outline: none;
            border-color: #4CAF50;
        }
        .restore-select option {
            background: #1a1a1a;
            color: #fff;
        }
    `);

    // 创建优化器面板
    function createOptimizerPanel() {
        const panel = document.createElement('div');
        panel.className = 'consumable-optimizer';
        panel.innerHTML = `
            <div class="panel-header">
                <h3>[银河奶牛]补给品组合计算器</h3>
                <div class="panel-controls">
                    <button class="panel-btn minimize-btn" title="最小化">−</button>
                </div>
            </div>
            <div class="optimizer-body">
                <div class="optimizer-section">
                    <div class="restore-input-group">
                        <label>恢复类型：</label>
                        <select id="restore-type" class="restore-select">
                            <option value="mp">回蓝(MP)</option>
                            <option value="hp">回血(HP)</option>
                        </select>
                    </div>
                    <div class="restore-input-group">
                        <label for="restore-input">最低恢复量：</label>
                        <input type="number" id="restore-input" class="restore-input" value="550" min="0" placeholder="输入需要的恢复量">
                    </div>
                </div>
                <div class="optimizer-section">
                    <h4>最佳搭配</h4>
                    <div class="loading">加载中...</div>
                </div>
                <div class="optimizer-section collapsible collapsed">
                    <h4 class="collapse-header">市场价格 <span class="collapse-icon">▼</span></h4>
                    <div class="collapse-content">
                        <div class="loading">加载中...</div>
                    </div>
                </div>
                <div class="optimizer-section collapsible collapsed">
                    <h4 class="collapse-header">每点蓝成本分析 <span class="collapse-icon">▼</span></h4>
                    <div class="collapse-content">
                        <div class="loading">加载中...</div>
                    </div>
                </div>
                <button class="update-btn">更新市场数据</button>
            </div>
        `;
        document.body.appendChild(panel);
        
        // 绑定折叠事件
        panel.querySelectorAll('.collapse-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.parentElement;
                section.classList.toggle('collapsed');
            });
        });
        
        // 绑定最小化按钮
        const minimizeBtn = panel.querySelector('.minimize-btn');
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('minimized');
            minimizeBtn.textContent = panel.classList.contains('minimized') ? '+' : '−';
        });
        
        // 拖动功能
        const header = panel.querySelector('.panel-header');
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('panel-btn')) return;
            isDragging = true;
            dragOffset.x = e.clientX - panel.offsetLeft;
            dragOffset.y = e.clientY - panel.offsetTop;
            panel.style.right = 'auto';
            panel.style.transition = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newX = e.clientX - dragOffset.x;
            let newY = e.clientY - dragOffset.y;
            
            // 边界限制
            newX = Math.max(0, Math.min(newX, window.innerWidth - panel.offsetWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - panel.offsetHeight));
            
            panel.style.left = newX + 'px';
            panel.style.top = newY + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            panel.style.transition = '';
        });
        
        return panel;
    }

    // 获取市场数据
    function fetchMarketData() {
        return new Promise((resolve, reject) => {
            console.log('[MWIConsumableOptimizer] 开始获取市场数据');
            console.log('[MWIConsumableOptimizer] API URL:', MARKET_API_URL);
            
            // 兼容不同的GM_xmlhttpRequest实现
            const sendRequest = typeof GM.xmlHttpRequest === "function" ? GM.xmlHttpRequest : typeof GM_xmlhttpRequest === "function" ? GM_xmlhttpRequest : null;
            
            console.log('[MWIConsumableOptimizer] GM.xmlHttpRequest:', typeof GM.xmlHttpRequest);
            console.log('[MWIConsumableOptimizer] GM_xmlhttpRequest:', typeof GM_xmlhttpRequest);
            console.log('[MWIConsumableOptimizer] sendRequest:', typeof sendRequest);
            
            if (!sendRequest) {
                reject(new Error('无法发送HTTP请求'));
                return;
            }
            
            sendRequest({
                method: 'GET',
                url: MARKET_API_URL,
                timeout: 5000,
                onload: function(response) {
                    console.log('[MWIConsumableOptimizer] 收到响应');
                    console.log('[MWIConsumableOptimizer] 响应状态:', response.status);
                    console.log('[MWIConsumableOptimizer] 响应文本长度:', response.responseText?.length);
                    
                    try {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            console.log('[MWIConsumableOptimizer] 解析后的数据结构:', Object.keys(data));
                            console.log('[MWIConsumableOptimizer] marketData存在?', !!data.marketData);
                            if (data.marketData) {
                                console.log('[MWIConsumableOptimizer] marketData中的物品数量:', Object.keys(data.marketData).length);
                                console.log('[MWIConsumableOptimizer] marketData前5个物品:', Object.keys(data.marketData).slice(0, 5));
                            }
                            marketData = data;
                            lastUpdateTime = Date.now();
                            resolve(data);
                        } else {
                            reject(new Error(`HTTP错误: ${response.status}`));
                        }
                    } catch (e) {
                        console.error('[MWIConsumableOptimizer] 解析响应失败:', e);
                        reject(e);
                    }
                },
                onerror: function() {
                    console.error('[MWIConsumableOptimizer] 网络错误');
                    reject(new Error('网络错误'));
                },
                ontimeout: function() {
                    console.error('[MWIConsumableOptimizer] 请求超时');
                    reject(new Error('请求超时'));
                }
            });
        });
    }

    // 获取物品价格详情
    // 根据 MWITools 和 mooket 的代码，市场数据格式为:
    // response.marketData[itemHrid][0] = { a: ask(卖出价/右买), b: bid(买入价/左买) }
    function getItemPriceDetails(itemHrid) {
        if (!marketData) {
            console.log('[MWIConsumableOptimizer] getItemPriceDetails: marketData为空');
            return null;
        }
        
        let bidPrice = null;  // 买入价 (左买)
        let askPrice = null;  // 卖出价 (右买)
        
        // API 返回的数据结构是 { marketData: { "/items/xxx": [{ a: ask, b: bid }] } }
        const marketDataObj = marketData.marketData || marketData;
        
        console.log('[MWIConsumableOptimizer] getItemPriceDetails:', itemHrid);
        console.log('[MWIConsumableOptimizer] marketData存在?', !!marketData);
        console.log('[MWIConsumableOptimizer] marketData.marketData存在?', !!marketData.marketData);
        console.log('[MWIConsumableOptimizer] marketDataObj存在?', !!marketDataObj);
        console.log('[MWIConsumableOptimizer] 查询的itemHrid:', itemHrid);
        console.log('[MWIConsumableOptimizer] itemHrid在marketDataObj中?', !!marketDataObj[itemHrid]);
        
        // 处理 MWITools/mooket 格式的 marketData
        // 格式: marketData[itemHrid][0] = { a: ask, b: bid }
        if (typeof marketDataObj === 'object' && marketDataObj[itemHrid]) {
            const itemData = marketDataObj[itemHrid];
            console.log('[MWIConsumableOptimizer] 找到itemData:', typeof itemData);
            
            if (Array.isArray(itemData) && itemData.length > 0) {
                // 格式: marketData[itemHrid][0] = { a: ask, b: bid }
                console.log('[MWIConsumableOptimizer] itemData是数组，长度:', itemData.length);
                console.log('[MWIConsumableOptimizer] itemData[0]:', itemData[0]);
                askPrice = itemData[0].a;
                bidPrice = itemData[0].b;
            } else if (typeof itemData === 'object') {
                // 可能是对象格式 { 0: { a: ask, b: bid } }
                console.log('[MWIConsumableOptimizer] itemData是对象');
                console.log('[MWIConsumableOptimizer] itemData内容:', itemData);
                console.log('[MWIConsumableOptimizer] itemData[0]:', itemData[0]);
                console.log('[MWIConsumableOptimizer] itemData[0].a:', itemData[0]?.a);
                console.log('[MWIConsumableOptimizer] itemData[0].b:', itemData[0]?.b);
                
                // 尝试从 itemData[0] 获取价格
                if (itemData[0] && typeof itemData[0] === 'object') {
                    askPrice = itemData[0].a;
                    bidPrice = itemData[0].b;
                } else {
                    // 回退到直接属性
                    askPrice = itemData.ask || itemData.a;
                    bidPrice = itemData.bid || itemData.b;
                }
            }
        } else {
            console.log('[MWIConsumableOptimizer] 未找到itemHrid对应的数据');
        }
        
        // 确保有有效值（只使用实际获取到的价格，不互相填充）
        const hasValidBid = bidPrice !== null && bidPrice !== undefined && !isNaN(bidPrice) && bidPrice > 0;
        const hasValidAsk = askPrice !== null && askPrice !== undefined && !isNaN(askPrice) && askPrice > 0;
        
        console.log('[MWIConsumableOptimizer] 价格有效性 - bid:', hasValidBid, 'ask:', hasValidAsk);
        
        // 如果两个价格都无效，返回null表示获取失败
        if (!hasValidBid && !hasValidAsk) {
            console.log('[MWIConsumableOptimizer] 无法获取有效价格');
            return null;
        }
        
        // 使用有效价格，无效的保持为null
        const finalBidPrice = hasValidBid ? bidPrice : null;
        const finalAskPrice = hasValidAsk ? askPrice : null;
        
        console.log('[MWIConsumableOptimizer] 最终价格 - bid:', finalBidPrice, 'ask:', finalAskPrice);
        
        return { bidPrice: finalBidPrice, askPrice: finalAskPrice };
    }
    
    // 获取物品价格（兼容旧代码）
    function getItemPrice(itemHrid) {
        const details = getItemPriceDetails(itemHrid);
        return details ? (details.askPrice || details.bidPrice) : null;
    }

    // 计算性价比
    // type: 'mp' 或 'hp'
    function calculateCostPerformance(type = 'mp') {
        console.log('[MWIConsumableOptimizer] 开始计算性价比, 类型:', type);
        
        const results = {
            items1: [],  // MP: 软糖, HP: 甜甜圈
            items2: []   // MP: 酸奶, HP: 蛋糕
        };

        // 根据类型选择数据源
        const dataSource1 = type === 'mp' ? restoreData.gummies : restoreData.donuts;
        const dataSource2 = type === 'mp' ? restoreData.yogurts : restoreData.cakes;
        const itemTypeName = type === 'mp' ? '回蓝' : '回血';

        // 计算第一类物品性价比
        console.log('[MWIConsumableOptimizer] 计算第一类物品性价比，物品数量:', Object.keys(dataSource1).length);
        for (const [hrid, restore] of Object.entries(dataSource1)) {
            const itemHrid = `/items/${hrid}`;
            console.log('[MWIConsumableOptimizer] 处理物品:', hrid, itemTypeName + ':', restore, 'itemHrid:', itemHrid);
            
            const priceDetails = getItemPriceDetails(itemHrid);
            console.log('[MWIConsumableOptimizer] 获取到的价格详情:', priceDetails);
            
            if (priceDetails && (priceDetails.bidPrice !== null || priceDetails.askPrice !== null)) {
                const bidPrice = priceDetails.bidPrice !== null ? priceDetails.bidPrice : priceDetails.askPrice;
                const askPrice = priceDetails.askPrice !== null ? priceDetails.askPrice : priceDetails.bidPrice;
                
                const leftPerformance = bidPrice !== null ? bidPrice / restore : Infinity;
                const rightPerformance = askPrice !== null ? askPrice / restore : Infinity;
                const avgPerformance = (leftPerformance + rightPerformance) / 2;
                
                console.log('[MWIConsumableOptimizer] 第一类物品计算结果:', {
                    name: itemNames[hrid],
                    bidPrice,
                    askPrice,
                    leftPerformance,
                    rightPerformance,
                    avgPerformance
                });
                
                results.items1.push({
                    hrid,
                    name: itemNames[hrid],
                    restore,
                    bidPrice,
                    askPrice,
                    leftPerformance,
                    rightPerformance,
                    performance: avgPerformance
                });
            } else {
                console.log('[MWIConsumableOptimizer] 第一类物品价格无效，跳过:', hrid);
            }
        }

        // 计算第二类物品性价比
        console.log('[MWIConsumableOptimizer] 计算第二类物品性价比，物品数量:', Object.keys(dataSource2).length);
        for (const [hrid, restore] of Object.entries(dataSource2)) {
            const itemHrid = `/items/${hrid}`;
            console.log('[MWIConsumableOptimizer] 处理物品:', hrid, itemTypeName + ':', restore, 'itemHrid:', itemHrid);
            
            const priceDetails = getItemPriceDetails(itemHrid);
            console.log('[MWIConsumableOptimizer] 获取到的价格详情:', priceDetails);
            
            if (priceDetails && (priceDetails.bidPrice !== null || priceDetails.askPrice !== null)) {
                const bidPrice = priceDetails.bidPrice !== null ? priceDetails.bidPrice : priceDetails.askPrice;
                const askPrice = priceDetails.askPrice !== null ? priceDetails.askPrice : priceDetails.bidPrice;
                
                const leftPerformance = bidPrice !== null ? bidPrice / restore : Infinity;
                const rightPerformance = askPrice !== null ? askPrice / restore : Infinity;
                const avgPerformance = (leftPerformance + rightPerformance) / 2;
                
                console.log('[MWIConsumableOptimizer] 第二类物品计算结果:', {
                    name: itemNames[hrid],
                    bidPrice,
                    askPrice,
                    leftPerformance,
                    rightPerformance,
                    avgPerformance
                });
                
                results.items2.push({
                    hrid,
                    name: itemNames[hrid],
                    restore,
                    bidPrice,
                    askPrice,
                    leftPerformance,
                    rightPerformance,
                    performance: avgPerformance
                });
            } else {
                console.log('[MWIConsumableOptimizer] 第二类物品价格无效，跳过:', hrid);
            }
        }
        
        console.log('[MWIConsumableOptimizer] 最终结果 - 第一类物品数量:', results.items1.length, '第二类物品数量:', results.items2.length);
        
        // 按恢复能力.txt中的顺序排序
        const items1Order = type === 'mp' 
            ? ['gummy', 'apple_gummy', 'orange_gummy', 'plum_gummy', 'peach_gummy', 'dragon_fruit_gummy', 'star_fruit_gummy']
            : ['donut', 'blueberry_donut', 'blackberry_donut', 'strawberry_donut', 'mooberry_donut', 'marsberry_donut', 'spaceberry_donut'];
        const items2Order = type === 'mp'
            ? ['yogurt', 'apple_yogurt', 'orange_yogurt', 'plum_yogurt', 'peach_yogurt', 'dragon_fruit_yogurt', 'star_fruit_yogurt']
            : ['cupcake', 'blueberry_cake', 'blackberry_cake', 'strawberry_cake', 'mooberry_cake', 'marsberry_cake', 'spaceberry_cake'];
        
        results.items1.sort((a, b) => items1Order.indexOf(a.hrid) - items1Order.indexOf(b.hrid));
        results.items2.sort((a, b) => items2Order.indexOf(a.hrid) - items2Order.indexOf(b.hrid));
        
        console.log('[MWIConsumableOptimizer] 排序完成');
        
        return results;
    }

    // 计算最佳搭配
    // 遍历所有可能的组合，分别找出左买、右买、平均性价比最高的组合
    // minRestore: 最低恢复量要求，只计算满足条件的组合
    // type: 'mp' 或 'hp'
    function findBestCombination(performanceData, minRestore = 0, type = 'mp') {
        console.log('[MWIConsumableOptimizer] 开始计算最佳搭配');
        console.log('[MWIConsumableOptimizer] 最低恢复量要求:', minRestore, '类型:', type);
        console.log('[MWIConsumableOptimizer] 第一类物品数量:', performanceData.items1.length, '第二类物品数量:', performanceData.items2.length);
        
        if (performanceData.items1.length === 0 && performanceData.items2.length === 0) {
            console.log('[MWIConsumableOptimizer] 无法计算最佳搭配 - 缺少数据');
            return null;
        }

        const itemTypeName = type === 'mp' ? '蓝' : '血';
        const item1TypeName = type === 'mp' ? '软糖' : '甜甜圈';
        const item2TypeName = type === 'mp' ? '酸奶' : '蛋糕';

        let bestLeftCombo = null;
        let bestLeftPerformance = Infinity;
        let bestRightCombo = null;
        let bestRightPerformance = Infinity;
        let bestAvgCombo = null;
        let bestAvgPerformance = Infinity;

        const updateBest = (comboData, typeKey) => {
            if (typeKey === 'left' && comboData.leftPerformance < bestLeftPerformance) {
                bestLeftPerformance = comboData.leftPerformance;
                bestLeftCombo = comboData;
            }
            if (typeKey === 'right' && comboData.rightPerformance < bestRightPerformance) {
                bestRightPerformance = comboData.rightPerformance;
                bestRightCombo = comboData;
            }
            if (typeKey === 'avg' && comboData.performance < bestAvgPerformance) {
                bestAvgPerformance = comboData.performance;
                bestAvgCombo = comboData;
            }
        };

        // 1. 遍历单一第一类物品
        for (const item1 of performanceData.items1) {
            if (item1.restore < minRestore) continue;
            
            const item1Bid = item1.bidPrice !== null ? item1.bidPrice : item1.askPrice;
            const item1Ask = item1.askPrice !== null ? item1.askPrice : item1.bidPrice;
            
            if (item1Bid === null && item1Ask === null) continue;
            
            const leftPerformance = item1Bid !== null ? item1Bid / item1.restore : Infinity;
            const rightPerformance = item1Ask !== null ? item1Ask / item1.restore : Infinity;
            const avgPerformance = (leftPerformance + rightPerformance) / 2;
            
            const comboData = {
                type: 'single-item1',
                item1: item1,
                item2: null,
                totalRestore: item1.restore,
                leftTotalPrice: item1Bid,
                rightTotalPrice: item1Ask,
                avgTotalPrice: ((item1Bid || 0) + (item1Ask || 0)) / 2,
                leftPerformance,
                rightPerformance,
                performance: avgPerformance
            };
            
            updateBest(comboData, 'left');
            updateBest(comboData, 'right');
            updateBest(comboData, 'avg');
            
            console.log('[MWIConsumableOptimizer] 单一' + item1TypeName + ':', item1.name, 
                '回' + itemTypeName + ':', item1.restore, '左买成本/' + itemTypeName + ':', leftPerformance.toFixed(2));
        }

        // 2. 遍历单一第二类物品
        for (const item2 of performanceData.items2) {
            if (item2.restore < minRestore) continue;
            
            const item2Bid = item2.bidPrice !== null ? item2.bidPrice : item2.askPrice;
            const item2Ask = item2.askPrice !== null ? item2.askPrice : item2.bidPrice;
            
            if (item2Bid === null && item2Ask === null) continue;
            
            const leftPerformance = item2Bid !== null ? item2Bid / item2.restore : Infinity;
            const rightPerformance = item2Ask !== null ? item2Ask / item2.restore : Infinity;
            const avgPerformance = (leftPerformance + rightPerformance) / 2;
            
            const comboData = {
                type: 'single-item2',
                item1: null,
                item2: item2,
                totalRestore: item2.restore,
                leftTotalPrice: item2Bid,
                rightTotalPrice: item2Ask,
                avgTotalPrice: ((item2Bid || 0) + (item2Ask || 0)) / 2,
                leftPerformance,
                rightPerformance,
                performance: avgPerformance
            };
            
            updateBest(comboData, 'left');
            updateBest(comboData, 'right');
            updateBest(comboData, 'avg');
            
            console.log('[MWIConsumableOptimizer] 单一' + item2TypeName + ':', item2.name, 
                '回' + itemTypeName + ':', item2.restore, '左买成本/' + itemTypeName + ':', leftPerformance.toFixed(2));
        }

        // 3. 遍历所有组合
        for (const item1 of performanceData.items1) {
            for (const item2 of performanceData.items2) {
                const totalRestore = item1.restore + item2.restore;
                
                if (totalRestore < minRestore) {
                    continue;
                }
                
                const item1Bid = item1.bidPrice !== null ? item1.bidPrice : item1.askPrice;
                const item1Ask = item1.askPrice !== null ? item1.askPrice : item1.bidPrice;
                const item2Bid = item2.bidPrice !== null ? item2.bidPrice : item2.askPrice;
                const item2Ask = item2.askPrice !== null ? item2.askPrice : item2.bidPrice;
                
                if (item1Bid === null || item1Ask === null || item2Bid === null || item2Ask === null) {
                    continue;
                }
                
                const leftTotalPrice = item1Bid + item2Bid;
                const leftComboPerformance = leftTotalPrice / totalRestore;
                
                const rightTotalPrice = item1Ask + item2Ask;
                const rightComboPerformance = rightTotalPrice / totalRestore;
                
                const avgComboPerformance = (leftComboPerformance + rightComboPerformance) / 2;
                
                const comboData = {
                    type: 'combo',
                    item1: item1,
                    item2: item2,
                    totalRestore,
                    leftTotalPrice,
                    rightTotalPrice,
                    avgTotalPrice: (leftTotalPrice + rightTotalPrice) / 2,
                    leftPerformance: leftComboPerformance,
                    rightPerformance: rightComboPerformance,
                    performance: avgComboPerformance
                };
                
                updateBest(comboData, 'left');
                updateBest(comboData, 'right');
                updateBest(comboData, 'avg');
            }
        }
        
        console.log('[MWIConsumableOptimizer] 左买最佳:', bestLeftCombo?.type, 
            bestLeftCombo?.item1?.name || '', bestLeftCombo?.item2?.name || '', 
            '成本/' + itemTypeName + ':', bestLeftCombo?.leftPerformance.toFixed(2));
        console.log('[MWIConsumableOptimizer] 右买最佳:', bestRightCombo?.type, 
            bestRightCombo?.item1?.name || '', bestRightCombo?.item2?.name || '', 
            '成本/' + itemTypeName + ':', bestRightCombo?.rightPerformance.toFixed(2));
        console.log('[MWIConsumableOptimizer] 平均最佳:', bestAvgCombo?.type, 
            bestAvgCombo?.item1?.name || '', bestAvgCombo?.item2?.name || '', 
            '成本/' + itemTypeName + ':', bestAvgCombo?.performance.toFixed(2));
        
        return {
            bestLeft: bestLeftCombo,
            bestRight: bestRightCombo,
            bestAvg: bestAvgCombo
        };
    }



    // 更新面板
    async function updatePanel(panel) {
        try {
            console.log('[MWIConsumableOptimizer] updatePanel 开始执行');
            console.log('[MWIConsumableOptimizer] 当前marketData存在?', !!marketData);
            
            // 获取恢复类型
            const restoreTypeSelect = panel.querySelector('#restore-type');
            const type = restoreTypeSelect?.value || 'mp';
            
            // 获取最低恢复量要求
            const restoreInput = panel.querySelector('#restore-input');
            const minRestore = parseInt(restoreInput?.value) || 0;
            console.log('[MWIConsumableOptimizer] 恢复类型:', type, '最低恢复量要求:', minRestore);
            
            // 检查缓存
            if (!marketData || (Date.now() - lastUpdateTime) > CACHE_DURATION) {
                console.log('[MWIConsumableOptimizer] 需要获取市场数据');
                await fetchMarketData();
                console.log('[MWIConsumableOptimizer] 成功获取市场数据');
            } else {
                console.log('[MWIConsumableOptimizer] 使用缓存的市场数据');
            }
            
            console.log('[MWIConsumableOptimizer] 调用calculateCostPerformance');
            const performanceData = calculateCostPerformance(type);
            console.log('[MWIConsumableOptimizer] calculateCostPerformance返回:', performanceData);
            
            console.log('[MWIConsumableOptimizer] 调用findBestCombination');
            const bestCombo = findBestCombination(performanceData, minRestore, type);
            console.log('[MWIConsumableOptimizer] findBestCombination返回:', bestCombo);

            // 检查是否有数据
            console.log('[MWIConsumableOptimizer] 检查结果 - 第一类物品数量:', performanceData.items1.length, '第二类物品数量:', performanceData.items2.length);
            if (performanceData.items1.length === 0 && performanceData.items2.length === 0) {
                console.error('[MWIConsumableOptimizer] 没有获取到物品价格数据');
                throw new Error('没有获取到物品价格数据');
            }

            const itemTypeName = type === 'mp' ? '蓝' : '血';
            const item1TypeName = type === 'mp' ? '软糖' : '甜甜圈';
            const item2TypeName = type === 'mp' ? '酸奶' : '蛋糕';

            // 更新最佳搭配部分（在optimizer-body内：输入框section=1, 最佳搭配section=2）
            const comboSection = panel.querySelector('.optimizer-body .optimizer-section:nth-child(2)');
            
            // 获取组合显示名称
            const getComboName = (combo) => {
                if (!combo) return '无数据';
                if (combo.type === 'single-item1') return combo.item1.name;
                if (combo.type === 'single-item2') return combo.item2.name;
                return `${combo.item1.name} + ${combo.item2.name}`;
            };
            
            // 获取组合类型标签
            const getTypeLabel = (combo) => {
                if (!combo) return '';
                if (combo.type === 'single-item1') return ` [单一${item1TypeName}]`;
                if (combo.type === 'single-item2') return ` [单一${item2TypeName}]`;
                return ' [组合]';
            };
            
            // 生成组合显示HTML的辅助函数
            const generateComboHTML = (combo, title, highlightClass = '') => {
                if (!combo) return `<div class="combo-group"><h5>${title}</h5><div class="loading">无数据</div></div>`;
                return `
                    <div class="combo-group ${highlightClass}">
                        <h5>${title}${getTypeLabel(combo)}</h5>
                        <div class="best-combo">
                            <div class="item-row">
                                <span class="item-name">物品</span>
                                <span class="item-value">${getComboName(combo)}</span>
                            </div>
                            <div class="item-row">
                                <span class="item-name">总回${itemTypeName}</span>
                                <span class="item-value">${combo.totalRestore}</span>
                            </div>
                            <div class="item-row">
                                <span class="item-name">总成本</span>
                                <span class="item-value">${combo.leftTotalPrice?.toLocaleString() || '-'}</span>
                            </div>
                            <div class="item-row">
                                <span class="item-name">成本/${itemTypeName}</span>
                                <span class="item-value">${combo.leftPerformance.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                `;
            };
            
            const generateRightComboHTML = (combo, title, highlightClass = '') => {
                if (!combo) return `<div class="combo-group"><h5>${title}</h5><div class="loading">无数据</div></div>`;
                return `
                    <div class="combo-group ${highlightClass}">
                        <h5>${title}${getTypeLabel(combo)}</h5>
                        <div class="best-combo">
                            <div class="item-row">
                                <span class="item-name">物品</span>
                                <span class="item-value">${getComboName(combo)}</span>
                            </div>
                            <div class="item-row">
                                <span class="item-name">总回${itemTypeName}</span>
                                <span class="item-value">${combo.totalRestore}</span>
                            </div>
                            <div class="item-row">
                                <span class="item-name">总成本</span>
                                <span class="item-value">${combo.rightTotalPrice?.toLocaleString() || '-'}</span>
                            </div>
                            <div class="item-row">
                                <span class="item-name">成本/${itemTypeName}</span>
                                <span class="item-value">${combo.rightPerformance.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                `;
            };
            
            const generateAvgComboHTML = (combo, title, highlightClass = '') => {
                if (!combo) return `<div class="combo-group"><h5>${title}</h5><div class="loading">无数据</div></div>`;
                return `
                    <div class="combo-group ${highlightClass}">
                        <h5>${title}${getTypeLabel(combo)}</h5>
                        <div class="best-combo">
                            <div class="item-row">
                                <span class="item-name">物品</span>
                                <span class="item-value">${getComboName(combo)}</span>
                            </div>
                            <div class="item-row">
                                <span class="item-name">总回${itemTypeName}</span>
                                <span class="item-value">${combo.totalRestore}</span>
                            </div>
                            <div class="item-row">
                                <span class="item-name">左买成本</span>
                                <span class="item-value">${combo.leftTotalPrice?.toLocaleString() || '-'}</span>
                            </div>
                            <div class="item-row">
                                <span class="item-name">右买成本</span>
                                <span class="item-value">${combo.rightTotalPrice?.toLocaleString() || '-'}</span>
                            </div>
                            <div class="item-row">
                                <span class="item-name">左买成本/${itemTypeName}</span>
                                <span class="item-value">${combo.leftPerformance.toFixed(2)}</span>
                            </div>
                            <div class="item-row">
                                <span class="item-name">右买成本/${itemTypeName}</span>
                                <span class="item-value">${combo.rightPerformance.toFixed(2)}</span>
                            </div>
                            <div class="item-row">
                                <span class="item-name">平均成本/${itemTypeName}</span>
                                <span class="item-value">${combo.performance.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                `;
            };
            
            comboSection.innerHTML = `
                <h4>最佳搭配</h4>
                ${generateComboHTML(bestCombo?.bestLeft, '🟢 左买最佳（用买入价bid）', 'highlight-left')}
                ${generateRightComboHTML(bestCombo?.bestRight, '🔴 右买最佳（用卖出价ask）', 'highlight-right')}
                ${generateAvgComboHTML(bestCombo?.bestAvg, '⭐ 平均最佳', 'highlight-avg')}
            `;

            // 更新市场价格部分（在optimizer-body内：输入框=1, 最佳搭配=2, 市场价格=3）
            const priceContent = panel.querySelector('.optimizer-body .optimizer-section:nth-child(3) .collapse-content');
            priceContent.innerHTML = `
                <div class="item-row">
                    <span class="item-name">物品</span>
                    <span class="item-value">买入价(bid)</span>
                    <span class="item-value">卖出价(ask)</span>
                    <span class="item-value">回${itemTypeName}</span>
                </div>
                ${performanceData.items1.map(item => `
                    <div class="item-row">
                        <span class="item-name">${item.name}</span>
                        <span class="item-value">${item.bidPrice?.toLocaleString() || '-'}</span>
                        <span class="item-value">${item.askPrice?.toLocaleString() || '-'}</span>
                        <span class="item-value">${item.restore}</span>
                    </div>
                `).join('')}
                ${performanceData.items2.map(item => `
                    <div class="item-row">
                        <span class="item-name">${item.name}</span>
                        <span class="item-value">${item.bidPrice?.toLocaleString() || '-'}</span>
                        <span class="item-value">${item.askPrice?.toLocaleString() || '-'}</span>
                        <span class="item-value">${item.restore}</span>
                    </div>
                `).join('')}
            `;

            // 更新每点成本分析部分（在optimizer-body内：输入框=1, 最佳搭配=2, 市场价格=3, 成本分析=4）
            const analysisContent = panel.querySelector('.optimizer-body .optimizer-section:nth-child(4) .collapse-content');
            analysisContent.innerHTML = `
                <div class="item-row">
                    <span class="item-name">物品</span>
                    <span class="item-value">左买成本/${itemTypeName}</span>
                    <span class="item-value">右买成本/${itemTypeName}</span>
                    <span class="item-value">平均成本/${itemTypeName}</span>
                </div>
                ${performanceData.items1.map(item => `
                    <div class="item-row">
                        <span class="item-name">${item.name}</span>
                        <span class="item-value">${item.leftPerformance === Infinity ? '-' : item.leftPerformance.toFixed(2)}</span>
                        <span class="item-value">${item.rightPerformance === Infinity ? '-' : item.rightPerformance.toFixed(2)}</span>
                        <span class="item-value">${item.performance === Infinity ? '-' : item.performance.toFixed(2)}</span>
                    </div>
                `).join('')}
                ${performanceData.items2.map(item => `
                    <div class="item-row">
                        <span class="item-name">${item.name}</span>
                        <span class="item-value">${item.leftPerformance === Infinity ? '-' : item.leftPerformance.toFixed(2)}</span>
                        <span class="item-value">${item.rightPerformance === Infinity ? '-' : item.rightPerformance.toFixed(2)}</span>
                        <span class="item-value">${item.performance === Infinity ? '-' : item.performance.toFixed(2)}</span>
                    </div>
                `).join('')}
            `;

        } catch (e) {
            console.error('更新面板错误:', e);
            
            // 显示错误信息
            const comboSection = panel.querySelector('.optimizer-body .optimizer-section:nth-child(2)');
            comboSection.innerHTML = `
                <h4>最佳搭配</h4>
                <div class="loading">无法获取市场数据</div>
            `;
            
            const priceContent = panel.querySelector('.optimizer-body .optimizer-section:nth-child(3) .collapse-content');
            priceContent.innerHTML = `<div class="loading">无法获取市场数据</div>`;
            
            const analysisContent = panel.querySelector('.optimizer-body .optimizer-section:nth-child(4) .collapse-content');
            analysisContent.innerHTML = `<div class="loading">无法获取市场数据</div>`;
        }
    }

    // 初始化
    function init() {
        const panel = createOptimizerPanel();
        
        // 初始更新
        updatePanel(panel);
        
        // 绑定更新按钮
        const updateBtn = panel.querySelector('.update-btn');
        updateBtn.addEventListener('click', () => {
            marketData = null; // 强制刷新
            updatePanel(panel);
        });
        
        // 绑定恢复类型切换事件
        const restoreTypeSelect = panel.querySelector('#restore-type');
        restoreTypeSelect.addEventListener('change', () => {
            updatePanel(panel);
        });
        
        // 绑定恢复量输入框事件
        const restoreInput = panel.querySelector('#restore-input');
        restoreInput.addEventListener('input', () => {
            updatePanel(panel);
        });
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
