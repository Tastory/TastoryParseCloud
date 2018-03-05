"use strict";
//
//  main.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
console.log("Tastory Parse Cloud Code main.js Running");
//
//  afterSaveFoodieStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
Parse.Cloud.afterSave("FoodieStory", function (request) {
    let reputableStory;
    let story = request.object;
    debugConsole.log(SeverityEnum.Verbose, "afterSave for storyID " + story.id);
    // We'll just check the existance of a reputableStory object. But dont't access it! It's not yet fetched!
    if (!story.get(FoodieStory.reputationKey)) {
        reputableStory = new ReputableStory();
        reputableStory.initializeReputation(story, reputationScoreStoryMetricVer);
        reputableStory.save(null, masterKeyOption).then(function (reputation) {
            story.set(FoodieStory.reputationKey, reputation);
            return story.save(null, masterKeyOption);
        }).then(function (story) {
            debugConsole.log(SeverityEnum.Debug, "New Reputation ID: " + reputableStory.id + " created for Story ID: " + story.id);
        }, function (error) {
            debugConsole.error("Failed to create Reputation for Story ID: " + story.id);
        });
    }
});
//
//  beforeSaveFoodieStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
Parse.Cloud.beforeSave("FoodieStory", function (request, response) {
    let story = request.object;
    let reputation = story.get(FoodieStory.reputationKey);
    debugConsole.log(SeverityEnum.Verbose, "beforeSave for storyID " + story.id);
    // Initialize Discoverability metrics if new Story
    if (!story.id) {
        // Check for Story Validity, Respond with error if deemed Invalid
        // A valid story must have a Title, a Venue and at least 3 Moments
        let title = story.get(FoodieStory.titleKey);
        if (title) {
            title = title.trim();
        }
        let venue = story.get(FoodieStory.venueKey);
        let moments = story.get(FoodieStory.momentsKey);
        if (!title) {
            response.error("Required fields empty - The Title and Venue are essential to a Story!");
            return;
        }
        else {
            story.set(FoodieStory.titleKey, title);
        }
        if (!venue) {
            response.error("Required fields empty - The Title and Venue are essential to a Story!");
            return;
        }
        if (!moments || moments.length < 3) {
            response.error("Your Story looks incomplete. Try adding at least 3 Moments.");
            return;
        }
        debugConsole.log(SeverityEnum.Verbose, "Initializing Discoverability for new Story");
        let author;
        if (!request.user) {
            response.error("Story has no Author");
            return;
        }
        else {
            author = request.user;
            story.set(FoodieStory.authorKey, author);
        }
        story.set(FoodieStory.discoverabilityKey, ScoreStoryMetric.initialScore);
        // Query FoodieRole class across all roles to see which role the current user is in
        let underDiscoverableLevel = false;
        let overDiscoverableLevel = false;
        let query = new Parse.Query(Parse.Role);
        query.find().then(function (roles) {
            let rolePromises = [];
            for (let role of roles) {
                let userRelation = role.getUsers();
                let userQuery = userRelation.query();
                userQuery.equalTo("objectId", author.id);
                let userPromise = userQuery.first().then(function (user) {
                    if (user) {
                        let level = role.get(FoodieRole.levelKey);
                        if (level < FoodieRole.defaultDiscoverableLevel) {
                            underDiscoverableLevel = true;
                        }
                        if (level >= FoodieRole.defaultDiscoverableLevel) {
                            overDiscoverableLevel = true;
                        }
                    }
                    return Parse.Promise.as(null);
                });
                rolePromises.push(userPromise);
            }
            return Parse.Promise.when(rolePromises);
        }).then(function () {
            if (underDiscoverableLevel) {
                debugConsole.log(SeverityEnum.Verbose, "Under Discoverable");
                story.set(FoodieStory.discoverableKey, false);
            }
            else if (overDiscoverableLevel) {
                debugConsole.log(SeverityEnum.Verbose, "Over Discoverable");
                story.set(FoodieStory.discoverableKey, true);
            }
            else {
                debugConsole.log(SeverityEnum.Verbose, "Else Discoverable");
                story.set(FoodieStory.discoverableKey, false);
            }
            response.success();
        }, function (error) {
            if (underDiscoverableLevel) {
                debugConsole.log(SeverityEnum.Verbose, "Under Discoverable");
                story.set(FoodieStory.discoverableKey, false);
            }
            else if (overDiscoverableLevel) {
                debugConsole.log(SeverityEnum.Verbose, "Over Discoverable");
                story.set(FoodieStory.discoverableKey, true);
            }
            else {
                debugConsole.log(SeverityEnum.Verbose, "Else Discoverable");
                story.set(FoodieStory.discoverableKey, false);
            }
            response.success();
        });
    }
    else if (reputation) {
        debugConsole.log(SeverityEnum.Verbose, "Discoverability score update for storyID " + story.id);
        reputation.fetch().then(function (reputableStory) {
            reputableStory.story = story; // Important!!! This handle is not auto populated by Parse. Always manually populate on retrieve!!
            story.set(FoodieStory.discoverabilityKey, reputation.calculateStoryScore());
            response.success();
        }, function (error) {
            debugConsole.error("Unable to fetch ReputableStory for Story ID: " + story.id);
            story.set(FoodieStory.discoverabilityKey, ScoreStoryMetric.defaultScore);
            response.success();
        });
    }
    else {
        debugConsole.error("Not expected a Story with ID but no Reputation Object");
        response.success();
    }
});
//
//  global.js
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-05
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
const masterKeyOption = { useMasterKey: true };
var reputationScoreStoryMetricVer = 1;
//
//  claimOnStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
Parse.Cloud.define("storyClaim", function (req, res) {
    debugConsole.log(SeverityEnum.Debug, "claimOnStory.ts ParseCloudFunction 'storyClaim' triggered");
    // Then we gotta establish who the reporter is first
    let user = undefined;
    if (req.user != undefined) {
        user = req.user;
    }
    else if (req.master === true) {
        user = null;
        debugConsole.error("'storyClaim' called with master not yet supported!!");
        res.error("User-less Claim via Master Key not yet supported");
        return;
    }
    else {
        debugConsole.error("'storyClaim' called with no source reporter!!");
        res.error("A source reporter is required to make a Reputation Claim against a Story");
        return;
    }
    // Extract storyId and claim type
    let storyId = req.params.targetId;
    let reporterId = user.id;
    // Process the claim input
    claimInputForStory(reporterId, storyId, req.params, function (anyArg, errorMsg) {
        if (!anyArg) {
            debugConsole.error(errorMsg);
            res.error(errorMsg);
        }
        else {
            debugConsole.log(SeverityEnum.Debug, "ParseCloudFunction 'storyClaim' from: " + reporterId + " to: " + storyId + " success response");
            res.success(anyArg);
        }
    });
});
function claimInputForStory(reporterId, storyId, claimParameters, callback) {
    debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts " + claimInputForStory.name + "() executed");
    debugConsole.log(SeverityEnum.Debug, "Story Reputation Claim Input" +
        "\nSource ID: " + reporterId +
        "\nTarget ID: " + storyId +
        "\nStory Claim Type: " + claimParameters.storyClaimType +
        "\nSet or Clear: " + claimParameters.setNotClear +
        "\nReaction Type: " + claimParameters.storyReactionType +
        "\nAction Type: " + claimParameters.storyActionType +
        "\nMoment Number: " + claimParameters.storyMomentNumber);
    // To understand what action needs to be taken for the new claim inputClaimOnStory
    // We have to first query the ReputableClaim database
    let storyClaims;
    let query = new Parse.Query(ReputableClaim);
    query.equalTo(ReputableClaim.sourceIdKey, reporterId);
    query.equalTo(ReputableClaim.targetIdKey, storyId);
    query.equalTo(ReputableClaim.claimTypeKey, ReputationClaimTypeEnum.StoryClaim); // We are only dealing with Story Claims in this function
    query.find().then(function (claims) {
        debugConsole.log(SeverityEnum.Debug, "claimOnStory.ts found " + claims.length + " relevant ReputableClaims");
        storyClaims = claims;
        // Get the Story & associated Reputation here
        // Might want to refactor out if there are other claim types to support
        let query = new Parse.Query(FoodieStory);
        query.include(FoodieStory.reputationKey);
        return query.get(storyId);
    }).then(function (story) {
        let reputableStory;
        // Extract the Reputation from the Story. Otherwise create a new ReputableStory object
        if (!story.get(FoodieStory.reputationKey)) {
            reputableStory = new ReputableStory();
            reputableStory.initializeReputation(story, reputationScoreStoryMetricVer);
        }
        else {
            reputableStory = story.get(FoodieStory.reputationKey);
            reputableStory.debugConsoleLog(SeverityEnum.Verbose);
        }
        reputableStory.story = story; // Important! This handle is not auto populated by Parse. Always manually populate!
        // Determine the claim scenario and action applicability
        // Find the immediate response cases before going into the next Promise chain
        let claimToSave = null;
        let claimsToDelete = [];
        switch (claimParameters.storyClaimType) {
            case StoryClaimTypeEnum.Reaction:
                if (claimParameters.setNotClear) {
                    let reactionType = claimParameters.storyReactionType;
                    claimToSave = ReputableClaim.createStoryReactionIfNotFound(reporterId, storyId, reactionType, storyClaims); // Returns claim if created. Null if found
                    if (claimToSave) {
                        reputableStory.incReactions(reactionType);
                    }
                }
                else {
                    let reactionType = claimParameters.storyReactionType;
                    claimsToDelete = ReputableClaim.deleteStoryReactionIfFound(reporterId, storyId, reactionType, storyClaims); // Returns true if cleam deleted
                    // No matter how many claims, just decrement only by 1 for now
                    if (claimsToDelete.length >= 1) {
                        reputableStory.decReactions(reactionType);
                    }
                }
                break;
            case StoryClaimTypeEnum.StoryAction:
                let actionType = claimParameters.storyActionType;
                claimToSave = ReputableClaim.createStoryActionIfNotFound(reporterId, storyId, actionType, storyClaims); // Returns claim if created. Null if found
                if (claimToSave) {
                    reputableStory.incActions(actionType);
                }
                break;
            case StoryClaimTypeEnum.StoryViewed:
                let storyViewReturn = ReputableClaim.updateStoryViewClaim(reporterId, storyId, claimParameters.storyMomentNumber, storyClaims); // Returns claim if created. Null if update not needed
                claimToSave = storyViewReturn.claim;
                if (claimToSave) {
                    if (storyViewReturn.prevMomentNumber) {
                        reputableStory.recalMaxMomentNumber(storyViewReturn.prevMomentNumber, storyViewReturn.newMomentNumber);
                    }
                    else {
                        reputableStory.addNewView(storyViewReturn.newMomentNumber);
                    }
                }
                break;
        }
        if (claimToSave) {
            // Save Claim & Reputation + Recalculate & Save Story
            claimToSave.save(null, masterKeyOption).then(function (claim) {
                return reputableStory.save(null, masterKeyOption);
            }).then(function (reputation) {
                reputation.story = story; // Just in case
                // Assume Recalculation will be performed in 'beforeSave' story.set(FoodieStory.discoverabilityKey, reputation.calculateStoryScore());
                story.set(FoodieStory.reputationKey, reputation);
                return story.save(null, masterKeyOption);
            }).then(function (story) {
                // Success!
                callback(story.get(FoodieStory.reputationKey), "");
            }, function (error) {
                debugConsole.error("claimInputForStory() Failed - " + error.code + " " + error.message);
                callback(null, "claimInputForStory() Failed - " + error.code + " " + error.message);
            });
        }
        else if (claimsToDelete.length >= 1) {
            // Delete Claim(s), Save Reputation & Recalculate & Save Story
            Parse.Object.destroyAll(claimsToDelete, masterKeyOption).then(function () {
                return reputableStory.save(null, masterKeyOption);
            }).then(function (reputation) {
                reputation.story = story; // Just in case
                // Assume Recalculation will be performed in 'beforeSave' story.set(FoodieStory.discoverabilityKey, reputation.calculateStoryScore());
                story.set(FoodieStory.reputationKey, reputation);
                return story.save(null, masterKeyOption);
            }).then(function (story) {
                // Success!
                callback(story.get(FoodieStory.reputationKey), "");
            }, function (error) {
                debugConsole.error("claimInputForStory() Failed - " + error.code + " " + error.message);
                callback(null, "claimInputForStory() Failed - " + error.code + " " + error.message);
            });
        }
        else {
            // Nothing needs to be done, respond with Success
            callback(reputableStory, "");
        }
    }, function (error) {
        debugConsole.error("claimInputForStory() Failed - " + error.code + " " + error.message);
        callback(null, "claimInputForStory() Failed - " + error.code + " " + error.message);
    });
}
//
//  radiusForMinStories.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
var QueryInitStoryEnum;
//
//  radiusForMinStories.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
(function (QueryInitStoryEnum) {
    QueryInitStoryEnum["RadiusFound"] = "RadiusFound";
})(QueryInitStoryEnum || (QueryInitStoryEnum = {}));
Parse.Cloud.define("radiusForMinStories", function (req, res) {
    debugConsole.log(SeverityEnum.Debug, "radiusForMinStories.ts ParseCloudFunction 'radiusForMinStories' triggered");
    let radii = [0.5, 1.0, 2.0, 4.0, 8.0, 16.0, 32.0, 64.0, 100.0]; // These numbers are in kms
    let location = new Parse.GeoPoint(req.params.latitude, req.params.longitude);
    let query = new Parse.Query(FoodieStory);
    let venueQuery = new Parse.Query(FoodieVenue);
    let minStories = 10.0; //req.params.minStories;
    let foundStories = 0;
    let radius = radii[0];
    venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 0.5km
    query.matchesQuery(FoodieStory.venueKey, venueQuery);
    query.equalTo(FoodieStory.discoverableKey, true);
    query.greaterThan(FoodieStory.discoverabilityKey, 0);
    query.count().then(function (numStories) {
        if (numStories >= minStories) {
            foundStories = numStories;
            return Promise.reject(QueryInitStoryEnum.RadiusFound);
        }
        else {
            radius = radii[1];
            venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 1.0km
            query.matchesQuery(FoodieStory.venueKey, venueQuery);
            return query.count();
        }
    }).then(function (numStories) {
        if (numStories >= minStories) {
            foundStories = numStories;
            return Promise.reject(QueryInitStoryEnum.RadiusFound);
        }
        else {
            radius = radii[2];
            venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 2.0km
            query.matchesQuery(FoodieStory.venueKey, venueQuery);
            return query.count();
        }
    }).then(function (numStories) {
        if (numStories >= minStories) {
            foundStories = numStories;
            return Promise.reject(QueryInitStoryEnum.RadiusFound);
        }
        else {
            radius = radii[3];
            venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 4.0km
            query.matchesQuery(FoodieStory.venueKey, venueQuery);
            return query.count();
        }
    }).then(function (numStories) {
        if (numStories >= minStories) {
            foundStories = numStories;
            return Promise.reject(QueryInitStoryEnum.RadiusFound);
        }
        else {
            radius = radii[4];
            venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 8.0km
            query.matchesQuery(FoodieStory.venueKey, venueQuery);
            return query.count();
        }
    }).then(function (numStories) {
        if (numStories >= minStories) {
            foundStories = numStories;
            return Promise.reject(QueryInitStoryEnum.RadiusFound);
        }
        else {
            radius = radii[5];
            venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 16km
            query.matchesQuery(FoodieStory.venueKey, venueQuery);
            return query.count();
        }
    }).then(function (numStories) {
        if (numStories >= minStories) {
            foundStories = numStories;
            return Promise.reject(QueryInitStoryEnum.RadiusFound);
        }
        else {
            radius = radii[6];
            venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 32km
            query.matchesQuery(FoodieStory.venueKey, venueQuery);
            return query.count();
        }
    }).then(function (numStories) {
        if (numStories >= minStories) {
            foundStories = numStories;
            return Promise.reject(QueryInitStoryEnum.RadiusFound);
        }
        else {
            radius = radii[7];
            venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 64km
            query.matchesQuery(FoodieStory.venueKey, venueQuery);
            return query.count();
        }
    }).then(function (numStories) {
        if (numStories >= minStories) {
            foundStories = numStories;
            return Promise.reject(QueryInitStoryEnum.RadiusFound);
        }
        else {
            radius = radii[8];
            venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 100km
            query.matchesQuery(FoodieStory.venueKey, venueQuery);
            return query.count();
        }
    }).then(function (numStories) {
        debugConsole.log(SeverityEnum.Verbose, "radiusForMinStories of " + minStories + " found " + numStories + " stories at a search radius of " + radius);
        res.success(radius); // Regardless of how many stories found, just return here anyways
    }, function (error) {
        if (error === QueryInitStoryEnum.RadiusFound) {
            debugConsole.log(SeverityEnum.Verbose, "radiusForMinStories of " + minStories + " found " + foundStories + " stories at a search radius of " + radius);
            res.success(radius);
        }
        else {
            debugConsole.error("radiusForMinStories Failed - " + error.code + " " + error.message);
            res.error("radiusForMinStories Failed - " + error.code + " " + error.message);
        }
    });
});
//
//  universalSearch.ts
//  TastoryParseCloud
//
//  Created by Victor Tsang on 2018-02-21
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
Parse.Cloud.define("universalSearch", function (req, res) {
    debugConsole.log(SeverityEnum.Debug, "universalSearch.ts ParseCloudFunction 'universalSearch' triggered");
    let searchTerm = req.params.keywords;
    debugConsole.log(SeverityEnum.Debug, "looking up: " + searchTerm);
    let queryFullName = new Parse.Query(FoodieUser);
    let queryUserName = new Parse.Query(FoodieUser);
    let queryStory = new Parse.Query(FoodieStory);
    let queryVenue = new Parse.Query(FoodieVenue);
    queryFullName.matches("fullName", searchTerm, "i");
    queryUserName.matches("username", searchTerm, "i");
    queryStory.matches("title", searchTerm, "i").include("venue").include("author");
    queryVenue.matches("name", searchTerm, "i");
    let userQuery = Parse.Query.or(queryFullName, queryUserName);
    // limit to 3 results for each category
    userQuery.limit(3);
    queryStory.limit(3);
    queryVenue.limit(3);
    var searchResults = [];
    // venue 
    // 	restaurant name (foursquare)
    // 	category (foursquare)
    userQuery.find().then(function (results) {
        debugConsole.log(SeverityEnum.Debug, "Found " + results.length + " users");
        let users = results;
        for (let user of users) {
            searchResults.push(user);
        }
        return queryStory.find();
    }).then(function (results) {
        debugConsole.log(SeverityEnum.Debug, "Found " + results.length + " stories");
        let stories = results;
        for (let story of stories) {
            searchResults.push(story);
        }
        return queryVenue.find();
    }).then(function (results) {
        debugConsole.log(SeverityEnum.Debug, "Found " + results.length + " venues");
        let venues = results;
        for (let venue of venues) {
            searchResults.push(venue);
        }
        res.success(searchResults);
    }, function (error) {
        res.error(error);
    });
});
//
//  recalStoryReputation.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-12
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
Parse.Cloud.job("hourlyReputationRecal", function (request, status) {
    // MARK: - Constants
    const hourInMs = 60 * 60 * 1000;
    const dayInMs = 24 * hourInMs;
    // MARK: - Constants for Configuration
    const msToRecalEvery4Hrs = 3 * dayInMs;
    const msToRecalEveryDay = 7 * dayInMs;
    const msToRecalEveryWk = 720 * dayInMs;
    // What time is it? Use it to determine the kind of recalculation to perform
    // Hourly trigger is presumed there
    let currentDate = new Date(); // This is THE date sample
    let currentDateInMs = currentDate.getTime();
    let recalNewerThanDate;
    // Weekly Recal. Note that Monday 4am Pacific is Monday noon UTC
    if (currentDate.getUTCDay() == 1 && currentDate.getUTCHours() == 12) {
        recalNewerThanDate = new Date(currentDateInMs - msToRecalEveryWk);
        debugConsole.log(SeverityEnum.Info, "Weekly Recalculation Triggered");
    }
    else if (currentDate.getUTCHours() == 12) {
        recalNewerThanDate = new Date(currentDateInMs - msToRecalEveryDay);
        debugConsole.log(SeverityEnum.Info, "Daily Recalculation Triggered");
    }
    else if (currentDate.getUTCHours() % 4 == 0) {
        recalNewerThanDate = new Date(currentDateInMs - msToRecalEvery4Hrs);
        debugConsole.log(SeverityEnum.Info, "4 Hours Interval Recalculation Triggered");
    }
    else {
        recalNewerThanDate = new Date(currentDateInMs - dayInMs);
        debugConsole.log(SeverityEnum.Info, "Hourly Recalculation Triggered");
    }
    // Lets look for some Stories~
    let query = new Parse.Query(FoodieStory);
    query.include(FoodieStory.reputationKey);
    query.greaterThanOrEqualTo("createdAt", recalNewerThanDate);
    query.descending("createdAt");
    query.limit(1000); // Make the limit 1000 for now. Perhaps later we gotta do some sort of paging recal
    query.find().then(function (stories) {
        let storiesToSave = [];
        debugConsole.log(SeverityEnum.Info, "Found " + stories.length + " Stories newer than " + recalNewerThanDate.toUTCString() + " for Reputation Recalculation");
        // Recalculate everything found
        for (let story of stories) {
            let reputableStory = story.get(FoodieStory.reputationKey);
            if (reputableStory && reputableStory.isValid) {
                reputableStory.story = story;
                // Assume Recalculation will be performed in 'beforeSave' story.set(FoodieStory.discoverabilityKey, reputableStory.calculateStoryScore());
                storiesToSave.push(story);
            }
        }
        // Save everything
        return Parse.Object.saveAll(storiesToSave, masterKeyOption);
    }).then(function (stories) {
        debugConsole.log(SeverityEnum.Info, "Story Reputation Recalculate & Save Successful!");
        if (status.success) {
            status.success("Story Reputation Recalculate & Save Successful!");
        }
    }, function (error) {
        debugConsole.log(SeverityEnum.Info, "Story Reputation Recalculate & Save Failed - " + error.code + ": " + error.message);
        if (status.error) {
            status.error("Story Reputation Recalculate & Save Failed - " + error.code + ": " + error.message);
        }
    });
});
//
//  foodieMoment.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-02-07
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
class FoodieMoment extends Parse.Object {
    constructor() {
        super("FoodieMoment");
    }
}
Parse.Object.registerSubclass("FoodieMoment", FoodieMoment);
//
//  foodieRole.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-02-21
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
// MARK: - Types & Enumerations
var FoodieRoleLevel;
//
//  foodieRole.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-02-21
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
// MARK: - Types & Enumerations
(function (FoodieRoleLevel) {
    FoodieRoleLevel[FoodieRoleLevel["LimitedUser"] = 10] = "LimitedUser";
    FoodieRoleLevel[FoodieRoleLevel["User"] = 20] = "User";
    //  EliteUser = 30
    //  PremiumUser = 40
    //  Venue = 100
    //  PremiumVenue = 110
    FoodieRoleLevel[FoodieRoleLevel["Moderator"] = 300] = "Moderator";
    //  ModeratorLvl2 = 310
    //  Moderatorlvl3 = 320
    FoodieRoleLevel[FoodieRoleLevel["Admin"] = 400] = "Admin";
    //  AdminLvl2 = 410
    //  AdminLvl3 = 420
    //  SuperAdmin = 500
})(FoodieRoleLevel || (FoodieRoleLevel = {}));
class FoodieRole extends Parse.Role {
}
FoodieRole.defaultDiscoverableLevel = 20; // 20 or higher is visible
FoodieRole.levelKey = "level";
//
//  foodieStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
class FoodieStory extends Parse.Object {
    constructor() {
        super("FoodieStory");
    }
}
FoodieStory.titleKey = "title";
FoodieStory.momentsKey = "moments";
FoodieStory.venueKey = "venue";
FoodieStory.authorKey = "author";
FoodieStory.discoverableKey = "discoverable";
FoodieStory.discoverabilityKey = "discoverability";
FoodieStory.reputationKey = "reputation";
Parse.Object.registerSubclass("FoodieStory", FoodieStory);
//
//  foodieUser.ts
//  TastoryParseCloud
//
//  Created by Victor Tsang on 2018-02-21
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
class FoodieUser extends Parse.User {
    constructor() {
        super("FoodieUser");
    }
}
FoodieUser.fullNameKey = "fullName";
FoodieUser.usernameKey = "username";
Parse.User.registerSubclass("FoodieStory", FoodieStory);
//
//  foodieVenue.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
class FoodieVenue extends Parse.Object {
    constructor() {
        super("FoodieVenue");
    }
}
FoodieVenue.locationKey = "location";
Parse.Object.registerSubclass("FoodieVenue", FoodieVenue);
//
//  reputableClaim.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
var ReputationClaimTypeEnum;
//
//  reputableClaim.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
(function (ReputationClaimTypeEnum) {
    ReputationClaimTypeEnum["StoryClaim"] = "storyClaim";
})(ReputationClaimTypeEnum || (ReputationClaimTypeEnum = {}));
var StoryClaimTypeEnum;
(function (StoryClaimTypeEnum) {
    StoryClaimTypeEnum[StoryClaimTypeEnum["Reaction"] = 1] = "Reaction";
    StoryClaimTypeEnum[StoryClaimTypeEnum["StoryAction"] = 2] = "StoryAction";
    StoryClaimTypeEnum[StoryClaimTypeEnum["StoryViewed"] = 3] = "StoryViewed";
})(StoryClaimTypeEnum || (StoryClaimTypeEnum = {}));
var StoryReactionTypeEnum;
(function (StoryReactionTypeEnum) {
    StoryReactionTypeEnum[StoryReactionTypeEnum["Like"] = 1] = "Like";
})(StoryReactionTypeEnum || (StoryReactionTypeEnum = {}));
;
var StoryActionTypeEnum;
(function (StoryActionTypeEnum) {
    StoryActionTypeEnum[StoryActionTypeEnum["Swiped"] = 1] = "Swiped";
    StoryActionTypeEnum[StoryActionTypeEnum["Venue"] = 2] = "Venue";
    StoryActionTypeEnum[StoryActionTypeEnum["Profile"] = 3] = "Profile";
    StoryActionTypeEnum[StoryActionTypeEnum["Shared"] = 4] = "Shared";
    StoryActionTypeEnum[StoryActionTypeEnum["Bookmark"] = 5] = "Bookmark";
})(StoryActionTypeEnum || (StoryActionTypeEnum = {}));
;
class ReputableClaim extends Parse.Object {
    constructor() {
        super("ReputableClaim");
    }
    // MARK: - Public Static Functions
    static createStoryReactionIfNotFound(reporterId, storyId, reactionType, claimsHistory) {
        debugConsole.log(SeverityEnum.Verbose, "reputableClaim.ts - createStoryReactionIfNotFound() executed");
        // Look at the claims history for already set reactions
        let existingReactions = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
            claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.Reaction));
        let matchingReactions = existingReactions.filter(reaction => (reaction.get(ReputableClaim.storyReactionTypeKey) === reactionType));
        // ??? Should we enforce 1 reaction type per user?
        if (existingReactions.length > 1 || matchingReactions.length > 0) {
            debugConsole.error("Set reaction type " + reactionType + " for storyID: " + storyId + " found " + existingReactions.length + " reactions & " + matchingReactions.length + " matches");
        }
        else {
            debugConsole.log(SeverityEnum.Verbose, "Set reaction type " + reactionType + " for storyID: " + storyId + " found " + existingReactions.length + " reactions & " + matchingReactions.length + " matches");
        }
        if (matchingReactions.length < 1) {
            // No matching reactions found, create a new reaction
            let claim = new ReputableClaim();
            claim.setAsStoryReaction(reporterId, storyId, reactionType);
            return claim;
        }
        else {
            // Matching reaction found, do nothing
            return null;
        }
    }
    static deleteStoryReactionIfFound(reporterId, storyId, reactionType, claimsHistory) {
        debugConsole.log(SeverityEnum.Verbose, "reputableClaim.ts deleteStoryReactionIfFound() executed");
        // Look at the claims history for already set reactions
        let existingReactions = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
            claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.Reaction));
        let matchingReactions = existingReactions.filter(reaction => (reaction.get(ReputableClaim.storyReactionTypeKey) === reactionType));
        // ??? Should we enforce 1 reaction type per user?
        if (existingReactions.length > 1 || matchingReactions.length < 1) {
            debugConsole.error("Clear reaction type " + reactionType + " for storyID: " + storyId + " found " + existingReactions.length + " reactions & " + matchingReactions.length + " matches");
        }
        else {
            debugConsole.log(SeverityEnum.Verbose, "Clear reaction type " + reactionType + " for storyID: " + storyId + " found " + existingReactions.length + " reactions & " + matchingReactions.length + " matches");
        }
        return matchingReactions;
    }
    static createStoryActionIfNotFound(reporterId, storyId, actionType, claimsHistory) {
        debugConsole.log(SeverityEnum.Verbose, "reputableClaim.ts - createStoryActionIfNotFound() executed");
        // Look at the claims history for already set reactions
        let matchingClaims = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
            claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.StoryAction &&
            claim.get(ReputableClaim.storyActionTypeKey) === actionType));
        if (matchingClaims.length > 1) {
            debugConsole.error("Set action type " + actionType + " for storyID: " + storyId + " found " + matchingClaims.length + " matches");
        }
        else {
            debugConsole.log(SeverityEnum.Verbose, "Set action type " + actionType + " for storyID: " + storyId + " found " + matchingClaims.length + " matches");
        }
        if (matchingClaims.length < 1) {
            // No matching reactions found, create a new reaction
            let claim = new ReputableClaim();
            claim.setAsStoryAction(reporterId, storyId, actionType);
            return claim;
        }
        else {
            // Matching claim(s) found, do nothing
            return null;
        }
    }
    static updateStoryViewClaim(reporterId, storyId, momentNumber, claimsHistory) {
        debugConsole.log(SeverityEnum.Verbose, "reputableClaim.ts - createStoryActionIfNotFound() executed");
        // Look at the claims history for already set reactions
        let matchingClaims = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
            claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.StoryViewed));
        if (matchingClaims.length > 1) {
            debugConsole.error("Set moment number to " + momentNumber + " for storyID: " + storyId + " found " + matchingClaims.length + " matches");
        }
        else {
            debugConsole.log(SeverityEnum.Verbose, "Set moment number to " + momentNumber + " for storyID: " + storyId + " found " + matchingClaims.length + " matches");
        }
        if (matchingClaims.length < 1) {
            // No matching view claim found. Create a new one
            let claim = new ReputableClaim();
            claim.setAsStoryViewed(reporterId, storyId, momentNumber);
            return { claim: claim, prevMomentNumber: null, newMomentNumber: momentNumber };
        }
        else {
            let claim = matchingClaims[0];
            let prevMomentNumber = claim.get(ReputableClaim.storyMomentNumberKey);
            debugConsole.log(SeverityEnum.Verbose, "Previous Adjusted Moment Number is " + prevMomentNumber + ", New Adjusted Moment Number is " + momentNumber);
            if (momentNumber > prevMomentNumber) {
                claim.set(ReputableClaim.storyMomentNumberKey, momentNumber);
                return { claim: claim, prevMomentNumber: prevMomentNumber, newMomentNumber: momentNumber };
            }
            else {
                return { claim: null, prevMomentNumber: prevMomentNumber, newMomentNumber: momentNumber };
            }
        }
    }
    // MARK: - Public Instance Functions
    setAsStoryReaction(reporterId, storyId, reactionType) {
        this.set(ReputableClaim.sourceIdKey, reporterId);
        this.set(ReputableClaim.targetIdKey, storyId);
        this.set(ReputableClaim.claimTypeKey, ReputationClaimTypeEnum.StoryClaim);
        this.set(ReputableClaim.storyClaimTypeKey, StoryClaimTypeEnum.Reaction);
        this.set(ReputableClaim.storyReactionTypeKey, reactionType);
    }
    setAsStoryAction(reporterId, storyId, actionType) {
        this.set(ReputableClaim.sourceIdKey, reporterId);
        this.set(ReputableClaim.targetIdKey, storyId);
        this.set(ReputableClaim.claimTypeKey, ReputationClaimTypeEnum.StoryClaim);
        this.set(ReputableClaim.storyClaimTypeKey, StoryClaimTypeEnum.StoryAction);
        this.set(ReputableClaim.storyActionTypeKey, actionType);
    }
    setAsStoryViewed(reporterId, storyId, momentNumber) {
        this.set(ReputableClaim.sourceIdKey, reporterId);
        this.set(ReputableClaim.targetIdKey, storyId);
        this.set(ReputableClaim.claimTypeKey, ReputationClaimTypeEnum.StoryClaim);
        this.set(ReputableClaim.storyClaimTypeKey, StoryClaimTypeEnum.StoryViewed);
        this.set(ReputableClaim.storyMomentNumberKey, momentNumber);
    }
}
// MARK: - Public Static Properties
ReputableClaim.sourceIdKey = "sourceId";
ReputableClaim.targetIdKey = "targetId";
ReputableClaim.claimTypeKey = "claimType";
// For Story Reputation Claims
ReputableClaim.storyClaimTypeKey = "storyClaimType";
ReputableClaim.storyReactionTypeKey = "storyReactionType";
ReputableClaim.storyActionTypeKey = "storyActionType";
ReputableClaim.storyMomentNumberKey = "storyMomentNumber";
Parse.Object.registerSubclass("ReputableClaim", ReputableClaim);
//
//  reputableStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
class ReputableStory extends Parse.Object {
    // MARK: - Constructor
    constructor() {
        super("ReputableStory");
    }
    // MARK: - Public Instance Functions
    initializeReputation(story, scoreMetricVer) {
        debugConsole.log(SeverityEnum.Verbose, "reputableStory.ts initializeReputation() for Story ID: " + story.id + " executed");
        this.set(ReputableStory.storyIdKey, story.id);
        this.set(ReputableStory.scoreMetricVerKey, scoreMetricVer);
        this.set(ReputableStory.usersViewedKey, 0);
        this.set(ReputableStory.usersLikedKey, 0);
        this.set(ReputableStory.usersSwipedUpKey, 0);
        this.set(ReputableStory.usersClickedVenueKey, 0);
        this.set(ReputableStory.usersClickedProfileKey, 0);
        this.set(ReputableStory.usersSharedKey, 0);
        this.set(ReputableStory.usersBookmarkedKey, 0);
        this.set(ReputableStory.totalMomentNumberKey, 0);
        this.set(ReputableStory.totalViewsKey, 0);
    }
    // Property Accessors
    getStoryId() {
        let getValue = this.get(ReputableStory.storyIdKey);
        if (getValue) {
            return getValue;
        }
        else {
            return "";
        }
    }
    getScoreMetricVer() {
        let getValue = this.get(ReputableStory.scoreMetricVerKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getUsersViewed() {
        let getValue = this.get(ReputableStory.usersViewedKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getUsersLiked() {
        let getValue = this.get(ReputableStory.usersLikedKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getUsersSwipedUp() {
        let getValue = this.get(ReputableStory.usersSwipedUpKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getUsersClickedVenue() {
        let getValue = this.get(ReputableStory.usersClickedVenueKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getUsersClickedProfile() {
        let getValue = this.get(ReputableStory.usersClickedProfileKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getUsersShared() {
        let getValue = this.get(ReputableStory.usersSharedKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getUsersBookmarked() {
        let getValue = this.get(ReputableStory.usersBookmarkedKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getTotalMomentNumber() {
        let getValue = this.get(ReputableStory.totalMomentNumberKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getTotalViews() {
        let getValue = this.get(ReputableStory.totalViewsKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    // Explicit Claims
    incReactions(type) {
        switch (type) {
            case StoryReactionTypeEnum.Like:
                this.incUsersLiked();
                break;
        }
    }
    decReactions(type) {
        switch (type) {
            case StoryReactionTypeEnum.Like:
                this.decUsersLiked();
                break;
        }
    }
    incUsersLiked() {
        this.increment(ReputableStory.usersLikedKey);
    }
    decUsersLiked() {
        this.increment(ReputableStory.usersLikedKey, -1);
    }
    // Implicit Claims
    incActions(type) {
        switch (type) {
            case StoryActionTypeEnum.Swiped:
                this.incUsersSwipedUp();
                break;
            case StoryActionTypeEnum.Venue:
                this.incUsersClickedVenue();
                break;
            case StoryActionTypeEnum.Profile:
                this.incUsersClickedProfile();
                break;
            case StoryActionTypeEnum.Bookmark:
                this.incUsersBookmarked();
                break;
            case StoryActionTypeEnum.Shared:
                this.incUsersShared();
        }
    }
    incUsersSwipedUp() {
        this.increment(ReputableStory.usersSwipedUpKey);
    }
    incUsersClickedVenue() {
        this.increment(ReputableStory.usersClickedVenueKey);
    }
    incUsersClickedProfile() {
        this.increment(ReputableStory.usersClickedProfileKey);
    }
    incUsersShared() {
        this.increment(ReputableStory.usersSharedKey);
    }
    incUsersBookmarked() {
        this.increment(ReputableStory.usersBookmarkedKey);
    }
    // View Counts
    incUsersViewed() {
        this.increment(ReputableStory.usersViewedKey);
    }
    incTotalViewed() {
        this.increment(ReputableStory.totalViewsKey);
    }
    addNewView(momentNumber) {
        this.increment(ReputableStory.usersViewedKey);
        this.increment(ReputableStory.totalMomentNumberKey, momentNumber);
    }
    recalMaxMomentNumber(prevMomentNumber, newMomentNumber) {
        let momentOffset = newMomentNumber - prevMomentNumber;
        this.increment(ReputableStory.totalMomentNumberKey, momentOffset);
    }
    // Score Calculation
    calculateStoryScore() {
        let scoringEngine = ScoreStoryMetric.scoreMetricVer[this.getScoreMetricVer()];
        debugConsole.log(SeverityEnum.Verbose, "calculating Story Score");
        if (scoringEngine) {
            return scoringEngine.calculate(this.story, this);
        }
        else {
            debugConsole.error("Unable to get Scoring Metric Ver: " + this.getScoreMetricVer());
            return ScoreStoryMetric.defaultScore;
        }
    }
    // Logging
    debugConsoleLog(severity) {
        debugConsole.log(severity, "ReputableStory ID: " + this.id +
            "\n" + ReputableStory.scoreMetricVerKey + ": " + this.getScoreMetricVer() +
            "\n" + ReputableStory.usersViewedKey + ": " + this.getUsersViewed() +
            "\n" + ReputableStory.usersLikedKey + ": " + this.getUsersLiked() +
            "\n" + ReputableStory.usersSwipedUpKey + ": " + this.getUsersSwipedUp() +
            "\n" + ReputableStory.usersClickedVenueKey + ": " + this.getUsersClickedVenue() +
            "\n" + ReputableStory.usersClickedProfileKey + ": " + this.getUsersClickedProfile() +
            "\n" + ReputableStory.usersSharedKey + ": " + this.getUsersShared() +
            "\n" + ReputableStory.usersBookmarkedKey + ": " + this.getUsersBookmarked() +
            "\n" + ReputableStory.totalMomentNumberKey + ": " + this.getTotalMomentNumber() +
            "\n" + ReputableStory.totalViewsKey + ": " + this.getTotalViews());
    }
}
// MARK: - Public Static Properties
ReputableStory.storyIdKey = "storyId";
ReputableStory.scoreMetricVerKey = "scoreMetricVer";
ReputableStory.usersViewedKey = "usersViewed";
ReputableStory.usersLikedKey = "usersLiked";
ReputableStory.usersSwipedUpKey = "usersSwipedUp";
ReputableStory.usersClickedVenueKey = "usersClickedVenue";
ReputableStory.usersClickedProfileKey = "usersClickedProfile";
ReputableStory.usersSharedKey = "usersShared";
ReputableStory.usersBookmarkedKey = "usersBookmarked";
ReputableStory.totalMomentNumberKey = "totalMomentNumber";
ReputableStory.totalViewsKey = "totalViews";
Parse.Object.registerSubclass("ReputableStory", ReputableStory);
//
//  reputableUser.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
class ReputableUser extends Parse.Object {
    constructor() {
        super("ReputableUser");
    }
}
Parse.Object.registerSubclass("ReputableUser", ReputableUser);
//
//  scoreStoryMetric.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
class ScoreStoryMetric {
    // MARK: - Constructor
    constructor(baseScore, percentageLikedWeighting, avgMomentWeighting, usersViewedWeighting, percentageSwipedWeighting, percentageClickedProfileWeighting, percentageClickedVenueWeighting, percentageSharedWeighting, percentageBookmarkedWeighting, newnessFactor, newnessHalfLife, decayHalfLife, avgMomentNormalizeConstant, usersViewedNormalizeLogConstant) {
        this.logCalculationSteps = false;
        this.baseScore = baseScore;
        this.percentageLikedWeighting = percentageLikedWeighting;
        this.avgMomentWeighting = avgMomentWeighting;
        this.usersViewedWeighting = usersViewedWeighting;
        this.percentageSwipedWeighting = percentageSwipedWeighting;
        this.percentageClickedProfileWeighting = percentageClickedProfileWeighting;
        this.percentageClickedVenueWeighting = percentageClickedVenueWeighting;
        this.percentageSharedWeighting = percentageSharedWeighting;
        this.percentageBookmarkedWeighting = percentageBookmarkedWeighting;
        this.newnessFactor = newnessFactor;
        this.newnessHalfLife = newnessHalfLife;
        this.decayHalfLife = decayHalfLife;
        this.avgMomentNormalizeConstant = avgMomentNormalizeConstant;
        this.usersViewedNormalizeLogConstant = usersViewedNormalizeLogConstant;
    }
    // MARK: - Public Instance Properties
    calculate(story, reputation) {
        // HACK: !! Keep Hidden Posts Hidden !!
        if (story.get(FoodieStory.discoverabilityKey) == 0) {
            return 0;
        }
        const msInDay = 24 * 60 * 60 * 1000;
        let currentDate = new Date();
        let creationTime = story.createdAt.getTime() / msInDay;
        let currentTime = currentDate.getTime() / msInDay;
        let storyAge = currentTime - creationTime; // This is in days
        debugConsole.log(SeverityEnum.Verbose, "Quality Score Calculation timestamp: " + currentDate.toUTCString() + " in Days " + currentTime + ",  creationDays: " + creationTime);
        // Let's see how much Newness Boost there is
        // Boost Score = Newness Factor x 1/(2^time)
        let newnessBoost = this.newnessFactor * 1 / Math.pow(2, storyAge);
        if (this.logCalculationSteps) {
            debugConsole.log(SeverityEnum.Verbose, "Newness Boost for storyID: " + story.id + " = " + newnessBoost);
        }
        // Let's calculate the Quality Component Score!!
        // User Views logarithmic normalization
        // User View Component Score = 1 - 1/log20(time + 20), where 20 is an example normalization constant
        let usersViewed = reputation.getUsersViewed();
        let usersViewedNormalized = 1 - 1 / (Math.log(usersViewed + this.usersViewedNormalizeLogConstant) / Math.log(this.usersViewedNormalizeLogConstant));
        let usersViewedWeighted = this.usersViewedWeighting * usersViewedNormalized;
        if (this.logCalculationSteps) {
            debugConsole.log(SeverityEnum.Verbose, "Users Viewed Weighted for storyID: " + story.id + " = " + usersViewedWeighted);
        }
        // Calculate the average number of Moments viewed
        let avgMomentsWeighted = 0;
        let percentageLikedWeighted = 0;
        let percentageSwipedWeighted = 0;
        let percentageClickedProfileWeighted = 0;
        let percentageClickedVenueWeighted = 0;
        let percentageSharedWeighted = 0;
        let percentageBookmarkedWeighted = 0;
        if (usersViewed != 0) {
            let avgMomentsViewed = reputation.getTotalMomentNumber() / reputation.getUsersViewed();
            // Moment number inverse normalization
            let avgMomentsNormalized = this.normalizeAvgMoment(avgMomentsViewed);
            avgMomentsWeighted = this.avgMomentWeighting * avgMomentsNormalized;
            if (this.logCalculationSteps) {
                debugConsole.log(SeverityEnum.Verbose, "Avg Moments Weighted for storyID: " + story.id + " = " + avgMomentsWeighted);
            }
            let percentageLiked = reputation.getUsersLiked() / reputation.getUsersViewed();
            if (percentageLiked > 1.0) {
                debugConsole.error("PercentageLiked = " + percentageLiked + " exceeded 100%");
                percentageLiked = Math.max(1.0, percentageLiked);
            }
            percentageLikedWeighted = this.percentageLikedWeighting * percentageLiked;
            let percentageSwiped = reputation.getUsersSwipedUp() / reputation.getUsersViewed();
            if (percentageSwiped > 1.0) {
                debugConsole.error("PercentageSwiped = " + percentageSwiped + " exceeded 100%");
                percentageSwiped = Math.max(1.0, percentageSwiped);
            }
            percentageSwipedWeighted = this.percentageSwipedWeighting * percentageSwiped;
            let percentageClickedProfile = reputation.getUsersClickedProfile() / reputation.getUsersViewed();
            if (percentageClickedProfile > 1.0) {
                debugConsole.error("PercentageClickedProfile = " + percentageClickedProfile + " exceeded 100%");
                percentageClickedProfile = Math.max(1.0, percentageClickedProfile);
            }
            percentageClickedProfileWeighted = this.percentageClickedProfileWeighting * percentageClickedProfile;
            let percentageClickedVenue = reputation.getUsersClickedVenue() / reputation.getUsersViewed();
            if (percentageClickedVenue > 1.0) {
                debugConsole.error("PercentageClickedVenue = " + percentageClickedVenue + " exceeded 100%");
                percentageClickedVenue = Math.max(1.0, percentageClickedVenue);
            }
            percentageClickedVenueWeighted = this.percentageClickedVenueWeighting * percentageClickedVenue;
            let percentageShared = reputation.getUsersShared() / reputation.getUsersViewed();
            if (percentageShared > 1.0) {
                debugConsole.error("PercentageShared = " + percentageShared + " exceeded 100%");
                percentageShared = Math.max(1.0, percentageShared);
            }
            percentageSharedWeighted = this.percentageSharedWeighting * percentageShared;
            let percentageBookmarked = reputation.getUsersBookmarked() / reputation.getUsersViewed();
            if (percentageBookmarked > 1.0) {
                debugConsole.error("percentageBookmarked = " + percentageBookmarked + " exceeded 100%");
                percentageBookmarked = Math.max(1.0, percentageBookmarked);
            }
            percentageBookmarkedWeighted = this.percentageBookmarkedWeighting * percentageBookmarked;
        }
        // Finally the Quality Component Score!!
        let qualityComponent = this.baseScore +
            percentageLikedWeighted +
            percentageSwipedWeighted +
            percentageClickedProfileWeighted +
            percentageClickedVenueWeighted +
            percentageSharedWeighted +
            percentageBookmarkedWeighted +
            usersViewedWeighted +
            avgMomentsWeighted;
        if (this.logCalculationSteps) {
            debugConsole.log(SeverityEnum.Verbose, "Quality Component for storyID: " + story.id + " = " + qualityComponent);
        }
        // Apply Quality Decay Half Life
        let decayedQuality = qualityComponent * 1 / Math.pow(2, storyAge / this.decayHalfLife);
        if (this.logCalculationSteps) {
            debugConsole.log(SeverityEnum.Verbose, "Decayed Quality for storyID: " + story.id + " = " + decayedQuality);
        }
        let totalScore = newnessBoost + decayedQuality;
        debugConsole.log(SeverityEnum.Verbose, "Total Quality Score for storyID: " + story.id + " = " + totalScore);
        return totalScore;
    }
    normalizeUsersViewed(usersViewed) {
        return 1 - 1 / (Math.log(usersViewed + this.usersViewedNormalizeLogConstant) / Math.log(this.usersViewedNormalizeLogConstant));
    }
    normalizeAvgMoment(avgMoment) {
        return 1 - 1 / (this.avgMomentNormalizeConstant * avgMoment + 1);
    }
}
ScoreStoryMetric.initialScore = 100; // 90 on max Newness Boost + 10 on base quality score
ScoreStoryMetric.defaultScore = 65; // Random middle of the road score
// MARK: - Defining Scoring Metric Versions
ScoreStoryMetric.scoreMetricVer = [
    null,
    // Story Scoring Metric ver. 1
    new ScoreStoryMetric(10, // baseScore: number;
    30, // percentageLikedWeighting: number;
    25, // avgMomentWeighting: number;
    40, // usersViewedWeighting: number;
    15, // percentageSwipedWeighting: number;
    10, // percentageClickedProfileWeighting: number;
    10, // percentageClickedVenueWeighting: number;
    30, // percentageSharedWeighting: number;
    20, // percentageBookmarkedWeighting: number;
    90, // newnessFactor: number;
    1.0, // newnessHalfLife: number; (in days)
    120, // decayHalfLife: number; (in days)
    0.3, // avgMomentNormalizeConstant: number;
    20) // usersViewedNormalizeLogConstant: number;
];
//
//  debugConsole.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-05
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
/* !!! Define Severity Enum here !!! */
var SeverityEnum;
//
//  debugConsole.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-05
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//
/* !!! Define Severity Enum here !!! */
(function (SeverityEnum) {
    SeverityEnum[SeverityEnum["Verbose"] = 0] = "Verbose";
    SeverityEnum[SeverityEnum["Debug"] = 1] = "Debug";
    SeverityEnum[SeverityEnum["Info"] = 2] = "Info";
    SeverityEnum[SeverityEnum["Warning"] = 3] = "Warning";
})(SeverityEnum || (SeverityEnum = {}));
/* !!! Configure Global Debug Severity here !!! */
let debugConsoleSeverity = SeverityEnum.Verbose;
class DebugConsole {
    // MARK: - Class Constructor
    constructor(severity) {
        this.loggingSeverity = severity;
    }
    // MARK: - Public Static Functions
    static getSingleton() {
        if (!DebugConsole.singleton) {
            DebugConsole.singleton = new DebugConsole(debugConsoleSeverity);
        }
        return DebugConsole.singleton;
    }
    // MARK: - Private Instance Functions
    severityHeader(severity) {
        switch (severity) {
            case SeverityEnum.Verbose:
                return "VERBOSE: ";
            case SeverityEnum.Debug:
                return "DEBUG:   ";
            case SeverityEnum.Info:
                return "INFO:    ";
            case SeverityEnum.Warning:
                return "WARNING: ";
        }
    }
    // MARK: - Public Instance Functions
    log(severity, message) {
        if (severity >= this.loggingSeverity) {
            console.log(this.severityHeader(severity) + message);
        }
    }
    error(message) {
        console.error("ERROR:   " + message);
    }
}
// MARK: - Global Access to Debug Print Singleton
var debugConsole = DebugConsole.getSingleton();
