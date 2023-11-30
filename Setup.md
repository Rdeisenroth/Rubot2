# Setup to test the bot

## Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a new application.
2. Under the `Bot` tab, of the application, enable all the `Privileged Gateway Intents`.
3. Under OAuth2 go the URL Generator and select the `applications.commands` and `bot` scopes. For bot permissions, select `Administrator`.
4. Copy the generated URL and paste it into your browser. Select the server you want to add the bot to and click `Authorize`.

## Creating a Test Server

1. Create a new server and add the bot to it (see above).
2. Go to the `Server Settings` and under `Roles` create a new role called `Admin` and give it the `Administrator` permission.
3. Assign the `Admin` role to the bot.
4. Also under `Roles` create three new roles called `Orga`, `Tutor`, and `Verified`, they don't need any permissions.
5. Call the command `/admin genverifyroles` to generate the roles in the database.
6. Create a new category, call it for example `Tutoring` and make it private but allow the `Tutor` role to see it.
7. Create one voice channel in the category, for example `tutoring-waiting` and allow the `Verified` role to see it. The `Tutor` role should be able to see it already because it is in the same category.
8. Call the command `/config queue create` and pass it the name for the queue and a description, for example `tutoring` and `the queue used to wait for tutoring`. This will create a new queue in the database.
9. Call the command `/config queue set_waiting_room` and pass it the name of the waiting channel, for example `tutoring-waiting` and the name of the queue, for example `tutoring` as well as the supervisor role, for example `Tutor`. This will set the waiting channel for the queue and the supervisor role.
10. Optionally rename the `coach` commands on the server to `tutor` by calling the command `/config commands rename` and passing it the old and new name of the command.

## Testing the Bot

1. Create a second discord account and join the test server.
2. Assign the `Verified` role to the test account.
3. Assign the `Tutor` role to the primary account.
4. You now have a working test setup. The test account acts as a student and the primary account acts as a tutor.