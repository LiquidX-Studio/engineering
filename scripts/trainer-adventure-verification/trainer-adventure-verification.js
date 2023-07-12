const ethers = require('ethers');
const csv = require("csvtojson");

// Visit the URL: https://etherscan.io/address/0x13182b9b97d27c5b09C5809b93c31F745d54aC82#readContract#F6. This URL will take you to the Etherscan page for the Smart Contract.
// On the Etherscan page, locate the function getWeekInfo. This function retrieves the seed numbers from the Smart Contract.
// In the input field for week, enter the value, for example: "8". This specifies that you want the seed numbers for Week 8.
// Click on the "Query" button next to the getWeekInfo function. This will trigger the function and display the result.
// Look for the result displayed on the page. It will be a comma-separated list of five numbers.
// Ignore the first two numbers in the list and take the remaining three numbers as the seed numbers for the week.
// Format the three seed numbers in single quotes and separate them with commas. For example, if the three seed numbers are 123, 456, and 789, the formatted result would be: ['456', '789', '123'].
const randomNumbers = ['21317810452841810817566809470071404394790744823867057240184044765981224602539','20067109942882360199897945184753810377330399697616170416285966231247106961738','46419027095881570572910917789706586816596255329203708843997511133135821651564'];
const totalTreaurePool = 163;


async function getTickets() {
    console.log('Reading data from CSV...')
    const ticketList = await csv().fromFile('./tickets-week-8.csv'); // ADD ticket csv file path of defined week 
    console.log('Total row from csv: ', ticketList.length);
    ticketList.sort((a,b) => a.ticket_number - b.ticket_number);
    return ticketList;
}


function generateRandomNumbers() {
    const multiplier = ethers.BigNumber.from(randomNumbers[0]);
    const increment = ethers.BigNumber.from(randomNumbers[1]);
    const modValue = ethers.BigNumber.from(randomNumbers[2]);
    let currentValue = ethers.BigNumber.from(1);
    let finalRandomNumbers = [];

    console.log(
        `${multiplier} ${increment} ${modValue} ${totalTreaurePool}`,
    );
    for (let index = 1; index <= totalTreaurePool; index++) {
        currentValue = currentValue
            .mul(multiplier)
            .add(increment)
            .mod(modValue);
            finalRandomNumbers.push(currentValue);
    }
    return finalRandomNumbers;
}

function drawTicket(tickets, randomNumbers) {
    let ticketForDraw = tickets;
    let winners = [];
    let walletAddressTreasureMap = new Map();
    for (const randomNumber of randomNumbers) {
        const currentTicketsRemaining = +ticketForDraw.length;
        if (currentTicketsRemaining < 1) {
           console.log(
                `All walletaddress is selected for gift/treasure.`,
            );
            break;
        }
        const winnerIndex = randomNumber
            .mod(currentTicketsRemaining)
            .toNumber();

        const winner = ticketForDraw[winnerIndex];
        winners.push(winner);

        ticketForDraw = filterWinnerTickets(
            ticketForDraw,
            winner.wallet_address,
            walletAddressTreasureMap,
            winner.ticket_number,
        );
    }
    return winners;
}

function filterWinnerTickets(
    tickets,
    walletAddress,
    walletAddressTreasureMap,
    ticket_number,
) {
    let treasureAmount = parseInt(walletAddressTreasureMap.get(walletAddress) + 1);
    if(treasureAmount === null || treasureAmount === undefined || isNaN(treasureAmount)){
        treasureAmount = 1;
    }
    walletAddressTreasureMap.set(walletAddress, treasureAmount);
    if(parseInt(treasureAmount) >= parseInt(2)) {
        tickets = tickets?.filter(
            (p) => p?.wallet_address !== walletAddress
        );
        return tickets;
    }
    else {
        tickets = tickets?.filter(
            (p) => p?.ticket_number !== ticket_number
        );
        return tickets;
    }
}

function getOccurances(winners, wallet){
    let counter = 0;
    for (w of winners) {
    if (w == wallet) {
            counter++;
        }
    };
    return counter;
}

(async () => {
    console.log('START\n\n');
	
    const ticketList = await getTickets();
    console.log('Total Ticket: ', ticketList.length);

    const randomNumbers = generateRandomNumbers();
    const winners = drawTicket(ticketList, randomNumbers);
    const winnerWallets = winners.map(p => p.wallet_address);

    const alreadyPrinted = [];

    for (const winner of winnerWallets) {
        if(alreadyPrinted.includes(winner))
            continue;
        const currentCount = getOccurances(winnerWallets, winner);
        console.log(`Wallet: ${winner} got ${currentCount} treasure/s`);
        alreadyPrinted.push(winner);
    }
    console.log('\n\nDONE');
})();


