Tripartite = {
		templates: {
			defaultTemplate: function(thedata) {
				return '' + thedata;
			}
		},
		constants: {
			templateBoundary: '__',
			templateNameBoundary: '##'
		},
		// This object (if set) will receive the template functions parsed from a script
		// I want to be able to call my templates as global functions, so I've set it
		// to be the window object
		secondaryTemplateFunctionObject: window
};

Tripartite.SimpleTemplate = function(conditional, data, handling) {
	var el = new Tripartite.ActiveElement(conditional, data, handling);
	return function(currentContext) {
		return el.run(currentContext);
		};
};

Tripartite.ActiveElement = function(conditional, data, handling) {
	this.conditionalExpression = conditional;
	this.dataSelectorExpression = data;
	if(handling) {
		this.handlingExpression = handling;
	}
	else {
		this.handlingExpression = 'defaultTemplate';
	}
	
	this.evaluatedData = null;
};

Tripartite.ActiveElement.prototype.run = function(currentContext) {
	var runTemplate = false;
	this.evaluatedData = this.evaluateDataSelectorExpression(currentContext);
	if(this.conditionalExpression) {
		runTemplate = this.evaluateInContext(currentContext, this.conditionalExpression);
	}
	else {
		if(this.evaluatedData instanceof Array) {
			if(this.evaluatedData.length > 0) {
				runTemplate = true;
			}
		}
		else {
			if(this.evaluatedData) {
				runTemplate = true;
			}
		}
	}
	
	var actualTemplate = this.handlingExpression;
	if(actualTemplate.charAt(0) == '$') {
		actualTemplate = this.evaluateInContext(currentContext, actualTemplate.substring(1));
	}
	if(!actualTemplate) {
		actualTemplate = 'defaultTemplate';
	}
	
	if(runTemplate) {
		if(this.evaluatedData instanceof Array) {
			var result = '';
			for(var i = 0; i < this.evaluatedData.length; i++) {
				result += Tripartite.templates[actualTemplate](this.evaluatedData[i]);
			}
			return result;
		}
		else {
			return Tripartite.templates[actualTemplate](this.evaluatedData);
		}
	}
	return '';
};

Tripartite.ActiveElement.prototype.evaluateDataSelectorExpression = function(currentContext) {
	if(!this.dataSelectorExpression) {
		return null;
	}
	if(this.dataSelectorExpression === '$this') {
		return currentContext;
	}
	return this.evaluateInContext(currentContext, this.dataSelectorExpression);
};

Tripartite.ActiveElement.prototype.evaluateInContext = function(currentContext, expression) {
	with (currentContext) {
		try {
			return eval(expression);
		} catch(e) {
			return null;
		}
	}
};

Tripartite.addTemplate = function(templateName, theTemplate) {
	if(typeof theTemplate !== 'function') {
		theTemplate = Tripartite.parseTemplate(theTemplate);
	}
	Tripartite.templates[templateName] = theTemplate;
	return theTemplate;
};

Tripartite.parseTemplateScript = function(thetext) {
	var tokens = Tripartite.tokenizeTemplateScript(thetext);
	var currentTemplateName = null;
	for(var i = 0; i < tokens.length; i++) {
		var token = tokens[i];
		if(token.active) {
			currentTemplateName = token.content;
		}
		else {
			if(currentTemplateName) {
				var template = Tripartite.addTemplate(currentTemplateName, token.content);
				if(Tripartite.secondaryTemplateFunctionObject) {
					Tripartite.secondaryTemplateFunctionObject[currentTemplateName] = template;
				}
				currentTemplateName = null;
			}
		}
	}
}

Tripartite.parseTemplate = function(thetext) {
	var tokens = Tripartite.tokenizeTemplate(thetext);
	var parts = [];
	for(var i = 0; i < tokens.length; i++) {
		var token = tokens[i];
		if(token.active) {
			parts.push(Tripartite.tokenizeActivePart(token.content));
		}
		else {
			if(token.content) {
				parts.push(token.content);
			}
		}
	}
	
	return function(currentContext) {
		var result = '';
		for(var i = 0; i < parts.length; i++) {
			if(typeof parts[i] === 'string') {
				result += parts[i];
			}
			else {
				result += parts[i](currentContext);
			}
		}
		return result;
	};
};

Tripartite.tokenizeActivePart = function(activeText) {
	var con = null;
	var dat = null;
	var han = null;
	
	var condIndex = activeText.indexOf('??');
	if(condIndex > -1) {
		con = activeText.substring(0, condIndex);
		condIndex += 2;
	}
	else {
		condIndex = 0;
	}
	
	var handIndex = activeText.indexOf('::');
	if(handIndex > -1) {
		dat = activeText.substring(condIndex, handIndex);
		han = activeText.substring(handIndex + 2);
	}
	else {
		dat = activeText.substring(condIndex);
	}
	return new Tripartite.SimpleTemplate(con, dat, han);
}

Tripartite.tokenizeTemplate = function(thetext) {
	return Tripartite.tokenizeActiveInactiveBlocks(thetext, Tripartite.constants.templateBoundary);
}

Tripartite.tokenizeTemplateScript = function(thetext) {
	return Tripartite.tokenizeActiveInactiveBlocks(thetext, Tripartite.constants.templateNameBoundary);
}

Tripartite.tokenizeActiveInactiveBlocks = function(thetext, activeRegionBoundary) {
	var wholeLength = thetext.length;
	var curPos = 0;
	var inActive = false;
	
	var tokens = [];
	
	while(curPos < wholeLength) {
		var index = thetext.indexOf(activeRegionBoundary, curPos);
		if(index == -1) {
			index = wholeLength;
		}
		var token = { active: inActive, content: thetext.substring(curPos, index)};
		tokens.push(token);
		curPos = index + 2;
		inActive = !inActive;
	}
	
	return tokens;
}




