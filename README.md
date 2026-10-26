# 台北大火鍋 · Taipei Da Huo Guo

原創瀏覽器紅油聚合遊戲。20 秒內慢慢拖曳油滴，接觸時合併，快速拖曳則分裂。

**直接開啟遊戲：[https://xylin46.github.io/taipei-da-huo-guo/](https://xylin46.github.io/taipei-da-huo-guo/)**

畫面左上方可隨時選擇 **Canvas 2D** 或 **Three.js 3D**，切換保留當前油滴、分數與剩餘時間。預設 Canvas；也可用 [Three.js 直達連結](https://xylin46.github.io/taipei-da-huo-guo/?renderer=three) 開啟 3D。

- Canvas 2D：俯視手繪風格，模糊與透明度閾值形成黏合油膜。
- Three.js 3D：立體鍋身、金屬鍋緣、筷子、光照與蒸氣，GPU shader 繪製聚合油膜與高光。需支援 WebGL 2；載入失敗時保留 Canvas 並顯示提示。

開鍋前可選擇兩種難度，Canvas 與 Three.js 都適用。每局開始後鎖定難度，結束後可重新選擇；兩種難度分開記錄最佳成績。

- **輕鬆**：保留原本手感，接近就聚合，較快速拖曳才分裂。
- **挑戰**：需拖曳紅油緩慢貼合約 0.22 秒才合併，不會自行連鎖聚合；分裂速度門檻降至原本約三分之一，兩滴大小的油片就能分裂，碎片會散得更遠且暫時無法重合。

兩種模式共用簡化的移動、阻尼、邊界與面積守恆合併，無外部物理引擎，也非完整流體模擬。純靜態 HTML、CSS、JavaScript，無建置步驟或後端。Three.js 0.180.0 隨專案附於 `vendor/`，執行時不依賴 Three.js CDN；[MIT 授權](vendor/THREE-LICENSE.txt) 一併保留。

直接以靜態 HTTP 伺服器開啟本目錄。GitHub Pages 設定：Deploy from a branch → main → / (root)。音效需使用者啟用；最佳成績儲存於瀏覽器。Google Fonts 無法連線時使用系統襯線字型。

玩法靈感來自 https://play.convfile.cc/mala-oil/ ，本專案未使用其程式或素材。兩種畫面均為本專案原創實作。
