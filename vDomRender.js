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
			const dom = document.createElement("div");//元素最外層(選取用)
			const dom2 = document.createElement(vdom.ele);
			dom2.dataset.id = (parent.dataset.id) ? parent.dataset.id + "-" + (parent.children.length+1) : parent.children.length+1;
			for (const prop in vdom.props) {
				this.setAttribute(dom2, prop, vdom.props[prop]);
			}
			for (const child of vdom.children) {
				this.render(child, dom2);
			}
			dom.append(dom2);
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
				dom[attr] = value[attr];
			}
		} else if (this.isPseudo(key, value)) {
			if (Object.entries(value).length > 0) {
				let pseudoStr = "";
				const styleEle = document.createElement("style");
				dom.className += "a" + dom.dataset.id;
				for (const pseudo in value) {
					pseudoStr += `.${dom.className}:${pseudo}{`;
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
}