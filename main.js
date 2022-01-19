//右鍵系統管理欄按鈕
; (function () {
  "use strick";
  var Systemmenu = function (eles = []) {
    if (eles.length === 0) return;
    let menu = document.getElementById("systemMenu") || null;//右鍵選單
    if (menu === null) return;
    let menuBTN = [];

    for (let i = 0; i < menu.querySelectorAll("li").length; i++) {
      menuBTN.push({ name: menu.querySelectorAll("li")[i].outerText, ele: menu.querySelectorAll("li")[i] });
    }

    for (let i = 0; i < eles.length; i++) {
      eles[i].onclick = function (e) {
        e.stopPropagation();
      }

      eles[i].oncontextmenu = function (e) {
        menu.style.display = "block";
        menu.style.top = e.clientY + "px";
        menu.style.left = e.clientX + "px";
        return false;
      };
    }

    document.onclick = function () {
      if (getComputedStyle(menu).display === "block") {
        menu.style.display = "none";
      }
    };

    return menuBTN;
  };

  window.Systemmenu = Systemmenu;
})();