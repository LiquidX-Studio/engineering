# Steps to run the script
1. Ensure that `Node.js` is installed on your system. You can download it from the official [Node.js website](https://nodejs.org/en/download) and follow the installation instructions specific to your operating system.

2. Verify that Yarn is installed. Yarn is a package manager for Node.js applications. You can install Yarn by following the installation instructions provided on the official [Yarn website](https://classic.yarnpkg.com/lang/en/).

3. Open the file `trainer-adventure-verification.js` and locate line 11 [const randomNumbers... line] . Update the code on that line based on the comments provided in the file in `lines 4-10`. Make the necessary modifications to ensure the code aligns with the given instructions.

4. Download the CSV file for the weekly tickets. The URL for the file can be found on Trainer Adventure verification blog. For example, if the URL is "https://pixelmon-trainer-adventure.s3.ap-southeast-1.amazonaws.com/participated-tickets/tickets-week-8.csv" download the file and save it in the same folder as the `trainer-adventure-verification.js` file. Rename the CSV file as needed. For instance, if the file name is `tickets-week-8.csv`, update `line 17` of the `trainer-adventure-verification.js` file with the new file name: `tickets-week-8.csv`.

5. Save all the changes you made to the `trainer-adventure-verification.js` file.

6. Open your command-line interface (e.g., Terminal, Command Prompt) and navigate to the folder where the `trainer-adventure-verification.js` file is located.

7. Run the command `yarn install` without quote in the command-line interface. This command will install the necessary dependencies for the project based on the package.json file.

8. Once the installation is complete, run the command `node trainer-adventure-verification.js` without quote in the command-line interface. This command will execute the JavaScript file and perform the verification process.

9. After running the script, you should have a winner list available. Now you can verify this winner list for the chosen week with the smart contract transaction 'updateWeeklyWinners' - "https://etherscan.io/txs?a=0x13182b9b97d27c5b09C5809b93c31F745d54aC82"