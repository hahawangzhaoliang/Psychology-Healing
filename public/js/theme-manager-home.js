    createHomeEffects() {
        // 家的主题：温馨的窗帘背景
        const container = document.createElement('div');
        container.id = 'theme-effects';
        container.innerHTML = `
            <style>
                .home-curtain {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 200px;
                    height: 100%;
                    background: linear-gradient(to left, rgba(232, 184, 125, 0.15), transparent);
                    pointer-events: none;
                    z-index: -1;
                }
                .home-curtain::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 50px;
                    width: 150px;
                    height: 100%;
                    background: linear-gradient(to left, rgba(168, 196, 212, 0.1), transparent);
                }
            </style>
            <div class="home-curtain"></div>
        `;
        document.body.appendChild(container);
    }
