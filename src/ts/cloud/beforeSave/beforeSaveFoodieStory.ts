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

  // Force update of Discoverability Score
  if (reputation) {
    debugConsole.log(SeverityEnum.Verbose, "beforeSave for storyID " + story.id + " with Reputation");
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
  }

  // Going to assume the lack of a reputation object means that this is a new story
  else {
    debugConsole.log(SeverityEnum.Verbose, "beforeSave for storyID " + story.id + " without Reputation");

    // Check for Story Validity, Respond with error if deemed Invalid
    // A valid story must have a Title, a Venue and at least 3 Moments

    let title: string = story.get(FoodieStory.titleKey);
    if (title) { title = title.trim(); }

    let venue: FoodieVenue = story.get(FoodieStory.venueKey);
    let moments: FoodieMoment[] = story.get(FoodieStory.momentsKey);

    if (!title) {
      response.error("Required fields empty - The Title and Venue are essential to a Story!");
      return
    }

    if (!venue) {
      response.error("Required fields empty - The Title and Venue are essential to a Story!");
      return
    }

    if (!moments || moments.length < 3) {
      response.error("Your Story looks incomplete. Try adding at least 3 Moments.");
      return
    }

    story.set(FoodieStory.titleKey, title);
    story.set(FoodieStory.discoverableKey, true);
    story.set(FoodieStory.discoverabilityKey, ScoreStoryMetric.initialScore);
    response.success();
  }
});
