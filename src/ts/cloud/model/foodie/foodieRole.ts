//
//  foodieRole.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-02-21
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//

// MARK: - Types & Enumerations

enum FoodieRoleLevel {

  LimitedUser = 10,
  User = 20,
//  EliteUser = 30
//  PremiumUser = 40
//  Venue = 100
//  PremiumVenue = 110
  Moderator = 300,
//  ModeratorLvl2 = 310
//  Moderatorlvl3 = 320
  Admin = 400
//  AdminLvl2 = 410
//  AdminLvl3 = 420
//  SuperAdmin = 500
}


class FoodieRole extends Parse.Role {

  static defaultDiscoverableLevel: number = 20;
  static levelKey: string = "level";
}
