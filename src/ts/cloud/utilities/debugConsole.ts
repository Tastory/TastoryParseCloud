//
//  debugConsole.js
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-05
//  Copyright © 2018 Tastry. All rights reserved.
//

/* !!! Define Severity Enum here !!! */
enum SeverityEnum {
  Verbose = 0,
  Debug,
  Info,
  Warning
}

/* !!! Configure Global Debug Severity here !!! */
let debugConsoleSeverity = SeverityEnum.Verbose;


class DebugConsole {

  // MARK: - Private Static Properties
  private static singleton: DebugConsole;

  // MARK: - Private Instance Properties
  private loggingSeverity: SeverityEnum;

  // MARK: - Class Constructor
  private constructor(severity: SeverityEnum) {
    this.loggingSeverity = severity;
  }

  // MARK: - Public Static Functions
  static getSingleton(): DebugConsole {
    if (!DebugConsole.singleton) {
      DebugConsole.singleton = new DebugConsole(debugConsoleSeverity);
    }
    return DebugConsole.singleton;
  }

  // MARK: - Private Instance Functions
  private severityHeader(severity: SeverityEnum) {
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
  log(severity: SeverityEnum, message: string) {
    if (severity >= this.loggingSeverity) {
      console.log(this.severityHeader(severity) + message);
    }
  }

  error(message: string) {
    console.error("ERROR:   " + message);
  }
}


// MARK: - Global Access to Debug Print Singleton
var debugConsole = DebugConsole.getSingleton();
