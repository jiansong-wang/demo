class Drag {
  constructor() {
    this.container = document.querySelector("#container");//內容區
    this.editWrap = document.querySelector("#editWrap");//編輯區
    this.layerWrap = document.querySelector("#layer");//階層區
    this.inputs = this.editWrap.getElementsByTagName("input");//編輯區所有輸入框
    this.selects = this.editWrap.getElementsByTagName("select");//編輯區所有選擇框
    this.com = document.getElementsByClassName("com");//所有元件
    this.comInfo = null;//所有組件
    this.pageCOMs = [];//頁面所有元件
    this.rule = null;//編輯區元件可以修改的規則
    this.currentFollow = null;//當前選擇的元素
    this.vdom = new VDomRender();//渲染dom

    this.init();
    this.loadRule();
  }

  /**初始化左側元件 */
  init() {
    let comWrap = document.querySelector("#comWrap");
    let xhr = new XMLHttpRequest();
    xhr.open("get", "./test.json");
    xhr.onload = () => {
      this.comInfo = JSON.parse(xhr.response);
      let str = "";
      if (this.comInfo.length > 0) {
        this.comInfo.forEach((item) => {
          str += `<li class="com" draggable="true" data-id="${item.ID}"><span>${item.Name}</span></li>`;
          //item.HtmlJson = JSON.parse(item.HtmlJson.replace(/(?:\\[rn]|[\r\n]+)+/g, ""));
          //console.log(item);
        });
        comWrap.innerHTML = str;
        this.addEvent();
      }
    };

    xhr.send();
  }

  /**載入元件可以修改的規則 */
  loadRule() {
    let xhr = new XMLHttpRequest();
    xhr.open("get", "./editRule.json");
    xhr.onload = () => {
      this.rule = JSON.parse(xhr.response).rule;
    };

    xhr.send();
  }

  /**元件的事件*/
  addEvent() {
    let menuBTN = (this.com.length > 0) ? SystemMenu(this.com) : [];//右鍵系統管理欄按鈕

    for (let item of this.com) {
      //拖曳開始
      item.ondragstart = function (e) {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', this.dataset.id);
        this.style.opacity = 0.5;
      };

      //拖曳結束
      item.ondragend = function () {
        this.style.opacity = 1;
      };

      //右鍵選單
      item.addEventListener("contextmenu", function () {
        menuBTN.forEach(itemBTN => {
          switch (itemBTN.name) {
            case "編輯":
              itemBTN.ele.onclick = () => {
                //Popup({ url: `/Tools/MoreCOM?ID=${this.dataset.id}` });
              };
              break;

            case "刪除":
              itemBTN.ele.onclick = () => {
                //AlertWindow({ info: "確定刪除?", status: "confirm" }).then(() => {
                //  ajaxData({ id: this.id }, "/Tools/Delete");
                //});
              };
              break;
          }
        });
      });
    }

    this.container.ondrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.dataset.drop === "true" || e.target === this.container) {
        const that = this;
        const id = e.dataTransfer.getData('text/plain');
        let currentCOM = this.comInfo.filter(item => item.ID === id);

        e.target.style.background = "";

        if (currentCOM.length > 0) {
          currentCOM = JSON.parse(JSON.stringify(currentCOM[0]));
          currentCOM.ID = e.target.dataset.id ? e.target.dataset.id + "-" + (e.target.children.length + 1) : e.target.children.length + 1 + "";
          currentCOM.ele = this.vdom.render(currentCOM.HtmlJson, e.target);

          //階層區
          const layerli = document.createElement("li");
          layerli.dataset.id = currentCOM.ID;
          layerli.innerText = currentCOM.Name;
          layerli.onclick = function () {
            const htmlJson = that.searchEleJson(this.dataset.id);
            that.editArea(htmlJson);

            that.focus(htmlJson.ele);
          };
          this.layerWrap.appendChild(layerli);

          currentCOM.ele.style.display = getComputedStyle(currentCOM.ele.children[0]).display;
          currentCOM.ele.style.setProperty("--w", currentCOM.ele.children[0].offsetWidth + parseFloat(getComputedStyle(currentCOM.ele.children[0]).marginLeft) + parseFloat(getComputedStyle(currentCOM.ele.children[0]).marginRight) + "px");
          currentCOM.ele.style.setProperty("--h", currentCOM.ele.children[0].offsetHeight + parseFloat(getComputedStyle(currentCOM.ele.children[0]).marginTop) + parseFloat(getComputedStyle(currentCOM.ele.children[0]).marginBottom) + "px");

          currentCOM.ele.onclick = function (e) {
            //e.preventDefault();
            e.stopPropagation();

            const htmlJson = that.searchEleJson(this.children[0].dataset.id);
            that.editArea(htmlJson);

            that.focus(this);
          };

          this.pushChildren(currentCOM);
          //console.log(this.pageCOMs)
        }
      }
    };

    this.container.ondragenter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.dataset.drop === "true" || e.target === this.container) {
        e.target.style.background = "#eee";
      }

      if (this.currentFollow !== null) {
        this.currentFollow.classList.toggle("follow");
        this.currentFollow = null;
        this.editWrap.innerHTML = "";
      }
    };

    this.container.ondragleave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.dataset.drop === "true" || e.target === this.container) {
        e.target.style.background = "";
      }
    };

    this.container.ondragover = function (e) {
      e.preventDefault();
      e.stopPropagation();
    };
  }

  /**
   * 放入到頁面所有元件或父元素的htmljson裡
   * @param {Object} currentCOM 當前的元件
   */
  pushChildren(currentCOM) {
    let parent = null, level = currentCOM.ID.split("-");

    if (level.length > 1) {
      do {
        parent = this.pageCOMs[level[0] - 1];
        level.shift();
      } while (level.length > 1);

      parent.HtmlJson.children.push(currentCOM);
    } else {
      this.pageCOMs.push(currentCOM);
    }
  }

  /**
   * 搜尋元素的JSON
   * @param {string} id 元素的ID
   */
  searchEleJson(id) {
    let node, list = [...this.pageCOMs], val;
    while (node = list.shift()) {
      if (val !== undefined) {
        return val;
      } else if (typeof node === "object" && val === undefined) {
        //console.log(node)
        val = (function (node) {
          if (node.ID === id) {
            return node;
          } else {
            node.HtmlJson.children && list.push(...node.HtmlJson.children);
          }
        })(node);
      }
    }
    return val;
  }

  /**
   * 關注元素外圍會有框框
   * @param {Element} who 被關注的元素
   */
  focus(who) {
    who.style.setProperty("--w", who.children[0].offsetWidth + parseFloat(getComputedStyle(who.children[0]).marginLeft) + parseFloat(getComputedStyle(who.children[0]).marginRight) + "px");
    who.style.setProperty("--h", who.children[0].offsetHeight + parseFloat(getComputedStyle(who.children[0]).marginTop) + parseFloat(getComputedStyle(who.children[0]).marginBottom) + "px");

    if (this.currentFollow !== null) {
      this.currentFollow.classList.toggle("follow");
    }

    this.currentFollow = who;

    if (who.className.indexOf("follow") < 0) {
      who.className += " follow";
    }
  }

  /**
  * 屬性編輯區
  * @param {Object} data 元素的JSON資料
  */
  editArea(data) {
    let rule = this.rule.filter(item => item.type === data.HtmlJson.ele)[0];
    if (rule === undefined) {
      this.editWrap.innerHTML = "";
      return;
    }
    if (data.HtmlJson.props.attr === undefined) {
      data.HtmlJson.props.attr = {};
    }
    if (data.HtmlJson.props.style === undefined) {
      data.HtmlJson.props.style = {};
    }
    //編輯區生成
    let attrStr = "", styleStr = "", otherStr = "";
    rule.attr.forEach(item => {
      let attrName = Object.keys(data.HtmlJson.props.attr).find(a => a === Object.keys(item)[1]);
      let val = (attrName) ? data.HtmlJson.props.attr[attrName] : "";

      attrStr += `<div><label>${item.name}：</label>`;
      if (Array.isArray(item[Object.keys(item)[1]])) {
        attrStr += `<select name="${Object.keys(item)[1]}">`;
        item[Object.keys(item)[1]].forEach(item => {
          attrStr += `<option value="${item}" ${(item === val) ? "selected" : ""}>${item}</option>`;
        });
        attrStr += "</select></div>";
      } else {
        attrStr += `<input type="text" name="${Object.keys(item)[1]}" value="${val}" data-type="attr"/></div>`;
      }
    });

    rule.style.forEach(item => {
      let styleName = Object.keys(data.HtmlJson.props.style).find(a => a === Object.keys(item)[1]);
      let val = (styleName) ? data.HtmlJson.props.style[styleName] : "";
      attrStr += `<div><label>${item.name}：</label><input type="text" name="${Object.keys(item)[1]}" value="${val}" data-type="style"/></div>`;
    });

    if (rule.isDrop !== undefined) {
      otherStr += `<div><label>是否可以嵌套：</label><input type="checkbox" ${(data.ele.children[0].dataset.drop === "true" ? "checked" : "")} data-type="drop"/>`;
    }

    this.editWrap.innerHTML = attrStr + styleStr + otherStr;

    //編輯區
    for (let i = 0; i < this.inputs.length; i++) {
      this.inputs[i].onchange = (e) => {
        if (e.target.dataset.type === "attr") {
          data.ele.children[0][e.target.name] = e.target.value;
          data.HtmlJson.props.attr[e.target.name] = e.target.value;
        } else if (e.target.dataset.type === "style") {
          let styleName = e.target.name.split("-");
          if (styleName.length > 1) {
            styleName = styleName[0] + styleName[1].slice(0, 1).toUpperCase() + styleName[1].slice(1);
          } else {
            styleName = styleName[0];
          }
          data.ele.children[0].style[styleName] = e.target.value;
          data.HtmlJson.props.style[e.target.name] = e.target.value;
        } else if (e.target.dataset.type === "drop") {
          data.ele.children[0].dataset.drop = e.target.checked;
        }
        data.ele.click();
      };
    }

    for (let i = 0; i < this.selects.length; i++) {
      this.selects[i].onchange = (e) => {
        data.ele.children[0][e.target.name] = e.target.value;
        data.HtmlJson.props.attr[e.target.name] = e.target.value;
        data.ele.click();
      };
    }
  }
}

new Drag();