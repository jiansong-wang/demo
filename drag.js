class Drag {
  constructor() {
    this.container = document.getElementById("container");
    this.editWrap = document.getElementById("editWrap");
    this.comInfo = null;//所有組件
    this.pageCOMs = [];//頁面所有元件
    this.init();
  }

  /**初始化左側元件 */
  init() {
    let comWrap = document.getElementById("comWrap");
    let xhr = new XMLHttpRequest();
    xhr.open("get", "./test.json");
    xhr.onload = () => {
      this.comInfo = JSON.parse(xhr.response);
      let str = "";
      if (this.comInfo.length > 0) {
        this.comInfo.forEach((item) => {
          str += `<li class="com" draggable="true" data-id="${item.ID}"><span>${item.Name}</span></li>`;
          //item.HtmlJson = JSON.parse(item.HtmlJson.replace(/(?:\\[rn]|[\r\n]+)+| /g, ""));
          console.log(item);
        });
        comWrap.innerHTML = str;
        this.addEvent();
      }
    };

    xhr.send();
  }

  /**
   * 轉換成html字串
   * @param {object} obj 
   * @returns {string} html
   */
  parseHtml(obj, id) {
    let html = `<${obj.ele} data-id="${id}"${this.parseAttr(obj.attr)}${obj.text}`;
    if (obj.sub.length > 0) {
      obj.sub.forEach((item, index) => {
        html += this.parseHtml(item, id + "-" + (index + 1));
      });
    }
    switch (obj.ele) {
      case "img":
      case "input":
        html += "/>";
        break;
      default:
        html += `</${obj.ele}>`;
    }
    return html;
  }

  /**
   * 轉換html屬性成字串
   * @param {Object} obj
   * @returns {string} html屬性
   */
  parseAttr(obj) {
    let attr = "";
    Object.keys(obj).map((item) => {
      attr += `${" " + item}="${obj[item]}"`;
    });
    return attr + ">";
  }

  /**元件的事件*/
  addEvent() {
    let com = document.getElementsByClassName("com") || [];
    let menuBTN = (com.length > 0) ? Systemmenu(com) : [];//右鍵系統管理欄按鈕

    for (let item of com) {
      item.ondragstart = function (e) {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
      };

      item.addEventListener("contextmenu", function () {
        menuBTN.forEach(itemBTN => {
          switch (itemBTN.name) {
            case "編輯":
              itemBTN.ele.onclick = () => {
                //Popup({ url: `/Tools/MoreCOM?ID=${this.dataset.id}` });
              }
              break;

            case "刪除":
              itemBTN.ele.onclick = () => {
                //AlertWindow({ info: "確定刪除?", status: "confirm" }).then(() => {
                //  ajaxData({ id: this.id }, "/Tools/Delete");
                //});
              }
              break;
          }
        });
      });
    }

    this.container.ondrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.dataset.drag || e.target === this.container) {
        let id = e.dataTransfer.getData('text/plain');
        let currentCOM = this.comInfo.filter(item => item.ID === id);

        e.target.style.background = "";

        if (currentCOM.length > 0) {
          currentCOM = JSON.parse(JSON.stringify(currentCOM[0]));
          currentCOM.ID = this.pageCOMs.length + 1 + "";
          currentCOM.htmlStr = this.parseHtml(currentCOM.HtmlJson, currentCOM.ID);
          let comNode = document.createRange().createContextualFragment(currentCOM.htmlStr).firstChild;
          currentCOM.ele = comNode;

          comNode.onclick = (e) => {
            e.preventDefault();
            let htmlJson = this.pageCOMs.filter(item => item.ID === e.target.dataset.id.split("-")[0])[0];
            this.editArea(htmlJson);
            //	console.log(htmlJson);
          };
          this.pageCOMs.push(currentCOM);
          e.target.append(comNode);
        }
        //console.log(this.pageCOMs);
      }
    };

    this.container.ondragenter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.dataset.drag || e.target === this.container) {
        e.target.style.background = "#eee";
      }
    };

    this.container.ondragleave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.dataset.drag || e.target === this.container) {
        e.target.style.background = "";
      }
    };

    this.container.ondragover = function (e) {
      e.preventDefault();
      e.stopPropagation();
    };
  }

  /**
   * 屬性編輯區
   * @param {Object} data 元素的JSON資料
   */
  editArea(data) {
    let ok = document.querySelector("#ok");
    this.editWrap.innerHTML = `<textarea style="width:100%;height:300px;">${JSON.stringify(data.HtmlJson)}</textarea>`;

    ok.onclick = () => {
      data.HtmlJson = JSON.parse(this.editWrap.querySelector("textarea").value);
      data.htmlStr = this.parseHtml(data.HtmlJson, data.ID);
      let newNode = document.createRange().createContextualFragment(data.htmlStr).firstChild;
      data.ele.parentNode.replaceChild(newNode, data.ele);
      data.ele = newNode;

      newNode.onclick = (e) => {
        e.preventDefault();
        let htmlJson = this.pageCOMs.filter(item => item.ID === e.target.dataset.id.split("-")[0])[0];
        this.editArea(htmlJson);
      };
    };
  }
}

new Drag();
