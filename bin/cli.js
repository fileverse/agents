#!/usr/bin/env node
const yargs = require('yargs');
const readline = require('readline');
const figlet = require('figlet');

const { Agent } = require('../index');

const getProjectName = async () => {
    let projectName = yargs.argv.name;

    if (!projectName) {
        const rl = createInterface();
        projectName = await askQuestion(rl, 'Enter project name: ');
        rl.close();
    }

    return projectName;
};

const createInterface = () => {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
};

const askQuestion = (rl, question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

const main = async () => {
    console.log("Fileverse Agents Kickstart!!!");
    const projectName = await getProjectName();
    console.log(`Project name **${projectName}**`);
    // fetching latest block number from gnosis chain
    const chain = 'gnosis';
    console.log(`Fetching latest block number from ${chain} chain`);
    const agent = new Agent(chain);
    const latestBlockNumber = await agent.getBlockNumber();
    console.log(`Latest block number: ${latestBlockNumber}`);
    figlet("Work  in  Progress !", function (err, data) {
        if (err) {
          console.log("Something went wrong...");
          console.dir(err);
          return;
        }
        console.log(data);
    });
};

main().catch(console.error);