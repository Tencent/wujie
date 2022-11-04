import { Component } from "@angular/core";

@Component({
  selector: "home",
  template: `
    <div class="home">
      <div class="tool">
        <button nz-button nzType="primary" style="visibility: hidden" class="button-gap" size="large">
          <i nz-icon nzType="unordered-list" nzTheme="outline"></i>
        </button>
        <div class="button-list">
          <nz-switch
            nz-tooltip
            nzTooltipTitle="主动降级，去除shadow+proxy"
            nzTooltipPlacement="bottom"
            class="switch button-gap"
            [ngModel]="degrade"
            (ngModelChange)="handleDegradeChange($event)"
            [nzDisabled]="disable"
            nzCheckedChildren="降级开"
            nzUnCheckedChildren="降级关"
          ></nz-switch>

          <nz-switch
            nz-tooltip
            nzTooltipTitle="预加载+预执行"
            nzTooltipPlacement="bottom"
            class="switch button-gap"
            [ngModel]="preload"
            (ngModelChange)="handlePreloadChange($event)"
            nzCheckedChildren="预加载开"
            nzUnCheckedChildren="预加载关"
          ></nz-switch>

          <a
            nz-tooltip
            nzTooltipTitle="主应用为hash模式"
            nzTooltipPlacement="bottom"
            (click)="goToLink('https://wujie-micro.github.io/demo-main-react/')"
            class="docs button-gap"
            >react主应用</a
          >
          <a
            nz-tooltip
            nzTooltipTitle="主应用为history模式"
            nzTooltipPlacement="bottom"
            (click)="goToLink('https://wujie-micro.github.io/demo-main-vue/')"
            class="docs button-gap"
            >vue主应用</a
          >
          <a (click)="goToLink('https://github.com/Tencent/wujie')" class="docs button-gap">仓库</a>
          <a (click)="goToLink('https://wujie-micro.github.io/doc/')" class="docs button-gap">文档</a>
        </div>
      </div>
      <h1 class="header">
        <img
          style="width: 70px; height: 70px; margin-right: 15px"
          src="https://vfiles.gtimg.cn/wuji_dashboard/xy/test_wuji_damy/XC5WMbxE.svg"
        />
        <span class="bland">无界</span>
      </h1>
      <h2 class="subtitle">—极致的微前端框架</h2>

      <div class="detail-content">
        <div class="item">
          <div class="title">极速 🚀</div>
          <div class="detail">
            <ul>
              <li>极致预加载提速</li>
              <li>应用秒开无白屏</li>
              <li>应用丝滑般切换</li>
            </ul>
          </div>
        </div>
        <div class="item">
          <div class="title">强大 💪</div>
          <div class="detail">
            <ul>
              <li>多应用同时激活在线</li>
              <li>应用级别保活</li>
              <li>去中心化的通信</li>
            </ul>
          </div>
        </div>
        <div class="item">
          <div class="title">简单 🤞</div>
          <div class="detail">
            <ul>
              <li>更小的体积</li>
              <li>精简的API</li>
              <li>开箱即用</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .button-gap {
        margin-bottom: 10px;
      }
      .button-list {
        flex: 1;
        display: flex;
        flex-direction: row-reverse;
        flex-wrap: wrap;
      }
      .tool {
        margin: 30px 20px 30px 0;
        display: flex;
        flex-direction: row;
        align-items: top;
      }
      .header {
        font-size: 70px;
        margin-top: 100px;
        text-align: center;
        font-weight: 300;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 200px;
      }
      .subtitle {
        font-size: 50px;
        margin-left: 250px;
        text-align: center;
        font-weight: 300;
        font-style: italic;
      }

      .bland {
        display: inline-block;
        font-weight: 400;
      }

      .title {
        font-size: 30px;
        color: var(--theme);
        text-align: center;
      }

      .switch {
        margin-left: 15px;
        height: 40px;
      }

      .switch ::ng-deep.ant-switch::after {
        top: 6px;
        width: 25px;
        height: 25px;
      }
      .switch ::ng-deep.ant-switch {
        height: 43.33px;
      }
      ::ng-deep.ant-switch-inner {
        font-size: 20px;
        padding: 5px 16px;
      }
      ::ng-deep.ant-switch-handle {
        top: 8px;
        width: 26px;
        height: 26px;
      }
      ::ng-deep.ant-switch-handle::before {
        border-radius: 26px;
      }
      ::ng-deep.ant-switch-checked .ant-switch-handle {
        left: calc(100% - 26px - 2px);
      }

      .docs {
        font-size: 20px;
        border: 1px solid rgb(217, 217, 217);
        box-shadow: 0 2px #00000004;
        color: rgb(44, 62, 80);
        padding: 5px 20px;
        border-radius: 20px;
        margin-left: 15px;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.1s linear;
      }
      .docs:hover {
        color: var(--theme);
        border: 1px solid var(--theme);
      }

      .detail-content {
        width: 900px;
        margin: 150px auto 0 auto;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }
      .detail-content .item ul {
        margin: 15px 0;
      }

      .home {
        font-size: 20px;
      }
      .home .ant-switch-checked {
        background-color: var(--theme);
      }
      span.switch {
        margin-left: 0;
        padding: 0;
      }

      @media screen and (max-width: 768px) {
        .subtitle {
          font-size: 35px;
          margin-left: 0;
          font-weight: 150;
        }
        .header {
          margin-right: 0;
        }
        .detail-content {
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: auto;
        }
        .item {
          width: 220px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
      }
      .switch .ant-switch-inner {
        font-size: 20px;
      }
    `,
  ],
})
export class HomeComponent {
  preload = window.localStorage.getItem("preload") !== "false";
  degrade = window.localStorage.getItem("degrade") === "true" || !window.Proxy || !window.CustomElementRegistry;
  disable = !window.Proxy || !window.CustomElementRegistry;

  handlePreloadChange(val) {
    window.localStorage.setItem("preload", val);
    setTimeout(() => window.location.reload(), 1000);
  }

  handleDegradeChange(val) {
    window.localStorage.setItem("degrade", val);
    setTimeout(() => window.location.reload(), 1000);
  }

  goToLink(url) {
    window.open(url, "_blank");
  }
}
