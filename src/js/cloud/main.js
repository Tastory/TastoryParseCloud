"use strict";
//
//  main.js
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
console.log("Tastory Parse Cloud Code main.js Running");
// MARK: - Parse Cloud Code references
// Project Common File references
var utilitiesJs = require("./utilities/debugConsole.js");
// Model JS File references
var reputableClaimJs = require("./model/reputation/reputableClaim.js");
var reputableStoryJs = require("./model/reputation/reputableStory.js");
var reputableUserJs = require("./model/reputation/reputableUser.js");
// Function JS File references
var claimOnStoryJs = require("./parse/function/claimOnStory.js");
console.log("main.js Checkpoint 0");
