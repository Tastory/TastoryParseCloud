//
//  reputableClaim.js
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
"use strict";
var ReputatbleClaimTypeEnum = {
    StoryClaim: "storyClaim"
};
var StoryClaimTypeEnum = {
    Reaction: 1,
    StoryAction: 2,
    StoryViewed: 3
};
var ReactionTypeEnum = {
    Like: 1
};
var StoryActionType = {
    Swiped: 1,
    Venue: 2,
    Profile: 3
};
class ReputableClaim extends Parse.Object {
    constructor() {
        super("ReputableClaim");
        // var sourceId: String?
        // var targetId: String?
        // var type: String?
        // For Story Reactions
        // var storyClaimType: Int
        // var reactionType: Int
        // var actionType: Int
        // var momentViewed: Int
    }
}
Parse.Object.registerSubclass("ReputableClaim", ReputableClaim);
