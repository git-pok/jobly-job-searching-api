# APP EXPLORATION
This document explains y finds and changes.

### AUTHORIZATION
The way this app authorizes is we create a header of authorization. Then we give it a value of Bearer token:
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9

We do not put any of the header data in strings either. So when we make a patch request to 'users/:username', with Insomnia, we create a header, then we create our body, then we send the request.

### sqlForPartialUpdate Tests
I tested the function with data, without data, and with no arguments. I commented the code also.