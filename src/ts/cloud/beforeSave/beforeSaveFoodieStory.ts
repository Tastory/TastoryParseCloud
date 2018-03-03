//
//  beforeSaveFoodieStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//

Parse.Cloud.beforeSave("FoodieStory", function(request, response) {
  let story: FoodieStory = request.object;
  let reputation: ReputableStory = story.get(FoodieStory.reputationKey);

  debugConsole.log(SeverityEnum.Verbose, "beforeSave for storyID " + story.id);

  // Check for Story Validity, Respond with error if deemed Invalid
  // A valid story must have a Title, a Venue and at least 3 Moments

  let title: string = story.get(FoodieStory.titleKey);
  if (title) { title = title.trim(); }

  let venue: FoodieVenue = story.get(FoodieStory.venueKey);
  let moments: FoodieMoment[] = story.get(FoodieStory.momentsKey);

  if (!title) {
    response.error("Required fields empty - The Title and Venue are essential to a Story!");
    return
  } else {
    story.set(FoodieStory.titleKey, title);
  }

  if (!venue) {
    response.error("Required fields empty - The Title and Venue are essential to a Story!");
    return
  }

  if (!moments || moments.length < 3) {
    response.error("Your Story looks incomplete. Try adding at least 3 Moments.");
    return
  }

  // Initialize Discoverability metrics if new Story

  if (!story.id) {
    debugConsole.log(SeverityEnum.Verbose, "Initializing Discoverability for new Story");
    let author: Parse.User;

    if (!request.user) {
      response.error("Story has no Author");
      return
    } else {
      author = request.user
      story.set(FoodieStory.authorKey, author);
    }

    story.set(FoodieStory.discoverabilityKey, ScoreStoryMetric.initialScore);

    // Query FoodieRole class across all roles to see which role the current user is in
    let underDiscoverableLevel = false
    let overDiscoverableLevel = false

    let query = new Parse.Query(Parse.Role);
    query.find().then(function(roles) {

      debugConsole.log(SeverityEnum.Verbose, "Role Query returned " + roles.length + " roles");

      let rolePromises: Parse.IPromise<null>[] = [];

      for (let role of roles) {
        debugConsole.log(SeverityEnum.Verbose, "Querying for User from Role " + role.getName());

        let userRelation = role.getUsers();
        let userQuery = userRelation.query();
        userQuery.equalTo("objectId", author.id);

        let userPromise = userQuery.first().then(function(user) {

          if (user) {
            debugConsole.log(SeverityEnum.Verbose, "Got User " + user.getUsername() + " from role " + role.getName());

            let level: number = role.get(FoodieRole.levelKey);

            if (level < FoodieRole.defaultDiscoverableLevel) {
              underDiscoverableLevel = true;
            }
            if (level > FoodieRole.defaultDiscoverableLevel) {
              overDiscoverableLevel = true;
            }
          }
          return Parse.Promise.as(null);
        });

        rolePromises.push(userPromise);
      }

      return Parse.Promise.when(rolePromises);

    }).then(function() {

      if (underDiscoverableLevel) {
        debugConsole.log(SeverityEnum.Verbose, "Under Discoverable");
        story.set(FoodieStory.discoverableKey, false);
      } else if (overDiscoverableLevel) {
        debugConsole.log(SeverityEnum.Verbose, "Over Discoverable");
        story.set(FoodieStory.discoverableKey, true);
      } else {
        debugConsole.log(SeverityEnum.Verbose, "Else Discoverable");
        story.set(FoodieStory.discoverableKey, false);
      }
      response.success();

    }, function(error) {

      if (underDiscoverableLevel) {
        debugConsole.log(SeverityEnum.Verbose, "Under Discoverable");
        story.set(FoodieStory.discoverableKey, false);
      } else if (overDiscoverableLevel) {
        debugConsole.log(SeverityEnum.Verbose, "Over Discoverable");
        story.set(FoodieStory.discoverableKey, true);
      } else {
        debugConsole.log(SeverityEnum.Verbose, "Else Discoverable");
        story.set(FoodieStory.discoverableKey, false);
      }
      response.success();
    });
  }

  // Update Discoverability Score

  else if (reputation) {
    debugConsole.log(SeverityEnum.Verbose, "Discoverability score update for storyID " + story.id);

    reputation.fetch().then(
      function(reputableStory) {
        reputableStory.story = story;  // Important!!! This handle is not auto populated by Parse. Always manually populate on retrieve!!
        story.set(FoodieStory.discoverabilityKey, reputation.calculateStoryScore());
        response.success();
      },
      function(error) {
        debugConsole.error("Unable to fetch ReputableStory for Story ID: " + story.id);
        story.set(FoodieStory.discoverabilityKey, ScoreStoryMetric.defaultScore);
        response.success();
      }
    );

  } else {
    debugConsole.error("Not expected a Story with ID but no Reputation Object");
    response.success();
  }
});
