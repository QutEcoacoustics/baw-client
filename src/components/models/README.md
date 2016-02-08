# Model standards

Models should:

- Be ES6 classes
- Inherit from `ApiBase`
- Should have a ` url` getter that returns the URL for a UI view (something a user can look at)
- Should convert all dates and numbers from strings
- (may) have a flag to indicate they are dirty

Models should **not**:

- Have any persistence logic 
- Need to reference any services

