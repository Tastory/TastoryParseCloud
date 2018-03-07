//
//  universalSearch.ts
//  TastoryParseCloud
//
//  Created by Victor Tsang on 2018-02-21
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.


Parse.Cloud.define("universalSearch", function(req, res) {
  debugConsole.log(SeverityEnum.Debug, "universalSearch.ts ParseCloudFunction 'universalSearch' triggered");

  let searchTerm = req.params.keywords
  let location = new Parse.GeoPoint(req.params.latitude, req.params.longitude);

  debugConsole.log(SeverityEnum.Debug , "looking up: " + searchTerm)
  debugConsole.log(SeverityEnum.Debug , "latitude: " + req.params.latitude)
  debugConsole.log(SeverityEnum.Debug , "longtitude: " + req.params.longitude)


  let queryFullName = new Parse.Query(FoodieUser).descending("fullName")
  let queryUserName = new Parse.Query(FoodieUser).descending("username")

  let queryStory = new Parse.Query(FoodieStory).descending("title")
	let queryVenue = new Parse.Query(FoodieVenue).near("location" , location)

  queryFullName.matches("fullName", searchTerm, "i")	
  queryUserName.matches("username", searchTerm , "i")
  queryStory.matches("title", searchTerm, "i").include("venue").include("author")
  queryVenue.matches("name", searchTerm, "i")

  queryFullName.limit(10)
  queryUserName.limit(10)
  queryStory.limit(10)
  queryVenue.limit(10)

  var searchResults:Parse.Object[] = []
  var userResults:FoodieUser[] = []

  queryFullName.find().then(
    function(results){
      debugConsole.log(SeverityEnum.Debug, "Found " + results.length + " users");
      let users: FoodieUser[] = results;
     
      for (let user of users) {
        userResults.push(user)
      }
      return queryUserName.find()
    }).then(
    function(results){
      debugConsole.log(SeverityEnum.Debug, "Found " + results.length + " usernames");
      let users: FoodieUser[] = results

      for (let user of users) {
        userResults.push(user)
      }

      rankResults<FoodieUser>(userResults, ["fullName", "username"], searchTerm, searchResults, 10)
      return queryStory.find()
    }).then(
    function(results){
      debugConsole.log(SeverityEnum.Debug, "Found " + results.length + " stories");
     
      rankResults<FoodieStory>(results, ["title"], searchTerm, searchResults, 10)

      return queryVenue.find()
    }).then(
    function(results){
      debugConsole.log(SeverityEnum.Debug, "Found " + results.length + " venues");
      let venues: FoodieVenue[] = results

      var numberOfVenues = 0
      for (let venue of venues) {
        if (numberOfVenues > 5) {
          break
        }
        searchResults.push(venue);
        numberOfVenues++;
      }
       
      res.success(searchResults)
    }, 
    function(error){
      res.error(error)
    });
});


function sortNumber(a: any, b: any) {
    return a - b
}

function rankResults<T extends Parse.Object>(results: Array<T>, attributes: string[], searchTerm: string, rankedResults: Parse.Object[], limit: Number): Number {
      var rankMap: Map<string, Array<[T,number]>> = new Map<string, Array<[T,number]>>();
       // generate list substring index position for rankMap
      for (let result of results) {
        for (let attribute of attributes) {
          let attributeStr: string = result.get(attribute);

          if (attributeStr == null) {  
            debugConsole.log(SeverityEnum.Verbose, "Cant find attribute:" + attributeStr + " in the object");
            continue
          } else {

            var re = new RegExp(searchTerm, 'i');
            let index: Number = attributeStr.search(re)

            if (index >= 0) {
              let indexStr: string = index.toString()
              if (!rankMap.has(indexStr)){
                rankMap.set(indexStr, new Array<[T,number]>())
              }

              //debugConsole.log(SeverityEnum.Verbose, "found item at position:" + indexStr);

              let resultList:Array<[T,Number]> | undefined = rankMap.get(indexStr)
              var insertIndex: number = 0

              // insertion sort 
              for (let result of resultList!) {
                if (attribute.length >= result[1]) {
                  insertIndex++;
                }
              }
              resultList!.splice(insertIndex, 0, [result,attribute.length])
            }
          }
        }
      }

      let keyList: Number[] = []

      for (let key of rankMap.keys()) {
        keyList.push(Number.parseInt(key))
      }

      keyList.sort(sortNumber)
    
      var numOfEntries = 0

      for (let key of keyList) {
         if(numOfEntries >= limit) {
           break
         }
         let keyStr: string = key.toString()

         if (rankMap.has(keyStr)) {
           let resultList:Array<[T,Number]> | undefined =  rankMap.get(keyStr)

           for (let result of resultList!) {

              if(numOfEntries >= limit) {
                break
              }
             numOfEntries++ 
             rankedResults.push(result[0])     
           }
         } else {
           debugConsole.log(SeverityEnum.Verbose, "Failed to find position index key :" + keyStr + " in rankMap");
         }
      }
      return numOfEntries
}


