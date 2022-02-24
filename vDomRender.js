class VDom {
	constructor(ele, props) {
		this.ele = ele && ele.toLowerCase();
		this.props = props;
		this.children = [];
	}

	pushChildren(vnode) {
		this.children.push(vnode);
	}
}

class VDomRender {
	isStyle(key, value) {
		return key === "style" && typeof value === "object";
	}

	isAttr(key, value) {
		return key === "attr" && typeof value === "object";
	}

	isPseudo(key, value) {
		return key === "pseudo" && typeof value === "object";
	}

	isEventListener(key, value) {
		return key.startsWith("on") && typeof value === "function";
	}

	isElementVdom(vdom) {
		return typeof vdom === "object" && typeof vdom.ele === "string";
	}

	isTextVdom(vdom) {
		return typeof vdom === "string" || typeof vdom === "number";
	}

	render(vdom, parent = null) {
		const mount = parent ? (el => parent.appendChild(el)) : (el => el);

		if (this.isTextVdom(vdom)) {
			return mount(document.createTextNode(vdom));
		} else if (this.isElementVdom(vdom)) {
			const dom = document.createElement(vdom.ele);//主要元素
			if (vdom.ele === "input") {
				dom.readOnly = "readOnly";
			}
			vdom.props.attr["data-id"] = (parent.dataset.id) ? parent.dataset.id + "-" + (parent.children.length + 1) : parent.children.length + 1;
			dom.dataset.id = vdom.props.attr["data-id"];
			for (const prop in vdom.props) {
				this.setAttribute(dom, prop, vdom.props[prop]);
			}
			for (const child of vdom.children) {
				this.render(child, dom);
			}
			return mount(dom);
		}
	}

	setAttribute(dom, key, value) {
		if (this.isEventListener(key, value)) {
			const eventType = key.slice(2).toLowerCase();
			dom.addEventListener(eventType, value);
		} else if (this.isStyle(key, value)) {
			Object.assign(dom.style, value);
		} else if (this.isAttr(key, value)) {
			for (const attr in value) {
				if (attr === "class") {
					dom.className = value[attr];
				} else {
					dom[attr] = value[attr];
				}
			}
		} else if (this.isPseudo(key, value)) {
			if (Object.entries(value).length > 0) {
				let pseudoStr = "";
				const styleEle = document.createElement("style");

				if (dom.className.indexOf("_test") >= 0) {
					dom.className=dom.className.replace("_test", "a" + dom.dataset.id);
				} else {
					dom.className += "a" + dom.dataset.id;
				}
				for (const pseudo in value) {
					pseudoStr += `${(pseudo.indexOf("_test") >= 0) ? pseudo.replace("_test",dom.className) : pseudo}{`;
					for (const styleName in value[pseudo]) {
						pseudoStr += `${styleName}:${value[pseudo][styleName]};`;
					}
					pseudoStr += "}";
				}
				styleEle.innerHTML = pseudoStr;
				dom.appendChild(styleEle);
			}
		}
	}

	/**
	 * html轉換成物件
	 * @param {Node} node html節點
	 */
	toVDom(node) {
		const nodeType = node.nodeType;
		let vnode = null;

		if (nodeType === 1) {
			const ele = node.nodeName;
			const attrs = node.attributes;
			let props = {
				attr: {},
				style: {}
			};
			const children = node.childNodes;

			for (let i = 0; i < attrs.length; i++) {
				if (attrs[i].nodeName === "style") {
					attrs[i].nodeValue.split(";").forEach((item) => {
						if (item !== "") {
							let s = item.split(":");
							props.style[s[0]] = s[1];
						}
					});
				} else {
					props.attr[attrs[i].nodeName] = attrs[i].nodeValue;
				}
			}

			vnode = new VDom(ele, props);

			for (let i = 0; i < children.length; i++) {
				if (children[i].nodeValue !== null) {
					if (children[i].nodeValue.replace(/^\n {0,}$/g, "") !== "") {
						vnode.pushChildren(this.toVDom(children[i]));
					}
				} else {
					vnode.pushChildren(this.toVDom(children[i]));
				}
			}
		} else if (nodeType === 3) {
			vnode = node.nodeValue.replace(/^\n {0,}$/g, "");
		}
		return vnode;
	}

	/**
	 * style轉換成物件(主要轉換偽類、偽元素)
	 * @param {StyleSheet} rules 樣式
	 */
	pseudoToObject(rules) {
		const pseudo = {};
		for (const item of rules) {
			pseudo[item.selectorText] = {};
			for (const s of item.style) {
				if (item.style[s] !== "initial") {
					pseudo[item.selectorText][s] = item.style[s];
				}
			}
		}
		return pseudo;
	}
}

export default VDomRender;