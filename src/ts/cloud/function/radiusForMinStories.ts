//
//  radiusForMinStories.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//

enum QueryInitStoryEnum {
  RadiusFound = "RadiusFound"
}


Parse.Cloud.define("radiusForMinStories", function(req, res) {
  debugConsole.log(SeverityEnum.Debug, "radiusForMinStories.ts ParseCloudFunction 'radiusForMinStories' triggered");

  let radii: number[] = [0.5, 1.0, 2.0, 4.0, 8.0, 16.0, 32.0, 64.0, 100.0];  // These numbers are in kms

  let location = new Parse.GeoPoint(req.params.latitude, req.params.longitude);
  let query = new Parse.Query(FoodieStory);
  let venueQuery = new Parse.Query(FoodieVenue);

  let minStories = req.params.minStories;
  let foundStories = 0;
  let radius = radii[0];

  venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 0.5km
  query.matchesQuery(FoodieStory.venueKey, venueQuery);
  query.equalTo(FoodieStory.discoverableKey, true);
  query.greaterThan(FoodieStory.discoverabilityKey, 0);

  query.count().then(function(numStories) {
    if (numStories >= minStories) {
      foundStories = numStories;
      return Promise.reject(QueryInitStoryEnum.RadiusFound);

    } else {
      radius = radii[1];
      venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 1.0km
      query.matchesQuery(FoodieStory.venueKey, venueQuery);

      return query.count();
    }

  }).then(function(numStories) {
    if (numStories >= minStories) {
      foundStories = numStories;
      return Promise.reject(QueryInitStoryEnum.RadiusFound);

    } else {
      radius = radii[2];
      venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 2.0km
      query.matchesQuery(FoodieStory.venueKey, venueQuery);

      return query.count();
    }

  }).then(function(numStories) {
    if (numStories >= minStories) {
      foundStories = numStories;
      return Promise.reject(QueryInitStoryEnum.RadiusFound);
    } else {
      radius = radii[3];
      venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 4.0km
      query.matchesQuery(FoodieStory.venueKey, venueQuery);

      return query.count();
    }

  }).then(function(numStories) {
    if (numStories >= minStories) {
      foundStories = numStories;
      return Promise.reject(QueryInitStoryEnum.RadiusFound);
    } else {
      radius = radii[4];
      venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 8.0km
      query.matchesQuery(FoodieStory.venueKey, venueQuery);

      return query.count();
    }

  }).then(function(numStories) {
    if (numStories >= minStories) {
      foundStories = numStories;
      return Promise.reject(QueryInitStoryEnum.RadiusFound);
    } else {
      radius = radii[5];
      venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 16km
      query.matchesQuery(FoodieStory.venueKey, venueQuery);

      return query.count();
    }

  }).then(function(numStories) {
    if (numStories >= minStories) {
      foundStories = numStories;
      return Promise.reject(QueryInitStoryEnum.RadiusFound);
    } else {
      radius = radii[6];
      venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 32km
      query.matchesQuery(FoodieStory.venueKey, venueQuery);

      return query.count();
    }

  }).then(function(numStories) {
    if (numStories >= minStories) {
      foundStories = numStories;
      return Promise.reject(QueryInitStoryEnum.RadiusFound);
    } else {
      radius = radii[7];
      venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 64km
      query.matchesQuery(FoodieStory.venueKey, venueQuery);

      return query.count();
    }

  }).then(function(numStories) {
    if (numStories >= minStories) {
      foundStories = numStories;
      return Promise.reject(QueryInitStoryEnum.RadiusFound);
    } else {
      radius = radii[8];
      venueQuery.withinKilometers(FoodieVenue.locationKey, location, radius); // 100km
      query.matchesQuery(FoodieStory.venueKey, venueQuery);

      return query.count();
    }
  }).then(function(numStories) {
    debugConsole.log(SeverityEnum.Verbose, "radiusForMinStories of " + minStories + " found " + numStories + " stories at a search radius of " + radius);
    res.success(radius);  // Regardless of how many stories found, just return here anyways
  },

  function(error) {
    if (error === QueryInitStoryEnum.RadiusFound) {
      debugConsole.log(SeverityEnum.Verbose, "radiusForMinStories of " + minStories + " found " + foundStories + " stories at a search radius of " + radius);
      res.success(radius);
    } else {
      debugConsole.error("radiusForMinStories Failed - " + error.code + " " + error.message);
      res.error("radiusForMinStories Failed - " + error.code + " " + error.message);
    }
  });
});
