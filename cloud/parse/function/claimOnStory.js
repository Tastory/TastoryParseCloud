//
//  claimOnStory.js
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

"use strict"

Parse.Cloud.define("storyClaim", function(req, res) {

  // Find all existing claim relationships between the source (User?) and the Story
  let user = undefined;

  console.log("claimOnStory.js ParseCloudFunction 'storyClaim' triggered");

  // Then we gotta establish who the reporter is first
  if (req.user != undefined) {
    user = req.user;
  } else if (req.master === true) {
    user = null;
    res.error("User-less Claim via Master Key not yet supported");
    return
  } else {
    res.error("A source reporter is required to make a Reputation Claim against a Story");
    return
  }

  // Extract storyId and claim type
  let storyId = req.params.storyId;
  let storyClaimType = req.params.storyClaimType;
  let reporterId = req.user.get("objectId");

  // Time to query the ReputableClaim database
  let ReputableClaim = Parse.Object.extend("ReputableClaim");
  let query = new Parse.Query(ReputableClaim);

  query.equalTo("source", reporterId);
  query.equalTo("target", storyId);
  query.find().then(
    function(results) {
      updateStoryClaims(req.params, reporterId, storyId, results);
    },
    function(error) {
      res.error("ParseCloudFunction 'storyClaim' failed: " + error.code + " " + error.message);
    }
  );

  // What type of claim is this? React accordingly based on claim relationships found

  // Update Roll-up of the target Story if necassary

  // Respond to the Client with a copy of the updated Story Reputation
});


function updateStoryClaims(parseReqParam, reporterId, storyId, claimsHistory) {
  console.log("ParseCloudFunction 'storyClaim' executed function 'updateStoryClaims'");
  console.log("Found " + claimsHistory.length + " matching Claims")
}
