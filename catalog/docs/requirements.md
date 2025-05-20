# Library requirements

## Usecases

### Base usecases
- User should be able to store and retrieve data in reactive process.
- Storing the data shouldn't have overhead and just directly be with rxjs.
- User should be able to store extra data in the query and command model.
- Both query and command model should be singleton.
 
### Query model
- User with one refresh method should be able to refresh data in query model.

### Command model
- User should be able to store parameters in command models.
- User with one mutate method should be able to mutate data in command model.
