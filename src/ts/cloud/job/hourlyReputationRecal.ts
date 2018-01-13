//
//  recalStoryReputation.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-12
//  Copyright © 2018 Tastry. All rights reserved.
//

Parse.Cloud.job("hourlyReputationRecal", function(request, status) {

  // MARK: - Constants
  const hourInMs: number = 60 * 60 * 1000;
  const dayInMs: number = 24 * hourInMs;

  // MARK: - Constants for Configuration
  const msToRecalEvery4Hrs: number = 3 * dayInMs;
  const msToRecalEveryDay: number = 7 * dayInMs;
  const msToRecalEveryWk: number = 720 * dayInMs;

  // What time is it? Use it to determine the kind of recalculation to perform
  // Hourly trigger is presumed there

  let currentDate = new Date();  // This is THE date sample
  let currentDateInMs = currentDate.getTime();
  let recalNewerThanDate: Date;

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
  query.find().then(function(stories) {

    let storiesToSave: FoodieStory[] = [];
    debugConsole.log(SeverityEnum.Info, "Found " + stories.length + " Stories newer than " + recalNewerThanDate.toUTCString() + " for Reputation Recalculation");

    // Recalculate everything found
    for (let story of stories) {
      let reputableStory: ReputableStory = story.get(FoodieStory.reputationKey);

      if (reputableStory && reputableStory.isValid) {
        reputableStory.story = story;
        // Assume Recalculation will be performed in 'beforeSave' story.set(FoodieStory.discoverabilityKey, reputableStory.calculateStoryScore());
        storiesToSave.push(story);
      }
    }

    // Save everything
    return Parse.Object.saveAll(storiesToSave, masterKeyOption);

  }).then(
    function(stories) {
      debugConsole.log(SeverityEnum.Info, "Story Reputation Recalculate & Save Successful!");
      if (status.success) { status.success("Story Reputation Recalculate & Save Successful!"); }
    },

    function(error) {
      debugConsole.log(SeverityEnum.Info, "Story Reputation Recalculate & Save Failed - " + error.code + ": " + error.message);
      if (status.error) { status.error( "Story Reputation Recalculate & Save Failed - " + error.code + ": " + error.message); }
    }
  )
});
