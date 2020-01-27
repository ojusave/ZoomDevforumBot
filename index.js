let request = require('request');
const dialogflow = require('dialogflow');
const uuid = require('uuid');
const {GoogleAuth} = require('google-auth-library');

async function dialogflow_req(query_text) {
    // A unique identifier for the given session
    const sessionId = uuid.v4();
    // getProjectId()
    let projectId = 'zoom-agent-1-exafhv';
        // Create a new session
    const sessionClient = new dialogflow.SessionsClient();
    const sessionPath = sessionClient.sessionPath(projectId, sessionId);

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: query_text,
                languageCode: 'en-US',
            },
        },
    };

    // Send request and log result
    const responses = await sessionClient.detectIntent(request);
    console.log('Detected intent');
    const result = responses[0].queryResult;
    console.log(`  Query: ${result.queryText}`);
    console.log(`  Response: ${result.fulfillmentText}`);

    let response = result.fulfillmentText
    if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
    } else {
        console.log(`  No intent matched.`);
    }
    return response
}

// get the lastest post from devforum
request('http://devforum.zoom.us/posts.json', function (error, response, body) {
    let latest_posts = JSON.parse(body).latest_posts;
    let topics = new Set();
    let categories = new Set([8])
    let post
    for(post in latest_posts){
            if(!topics.has(latest_posts[post].topic_id)){
                topics.add(latest_posts[post].topic_id);
                if(latest_posts[post].post_number == 1 &&
                    categories.has(latest_posts[post].category_id)){
                    // send request to dialogflow
                    let query_text = "topic_id: "+latest_posts[post].topic_id+",category_id: "+latest_posts[post].category_id+",topic_title: "+latest_posts[post].topic_title;
                    console.log("Query: "+query_text);
                    dialogflow_req(query_text).then(function(response) {
                        // response to devforum
                        console.log(response)
                        let response_options = {
                            'method': 'POST',
                            'url': 'http://devforum.zoom.us/posts.json',
                            'headers': {
                                'Authorization': '',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                "topic_id": latest_posts[post].topic_id,
                                "raw": response
                            })
                        }
                        request(response_options, function (error, response) {
                            console.log(response)
                            if (error) {
                                console.log(error)
                            }
                        })
                    })
                }
            }
        }
        // 1 minute pause for polling
        sleep(60000).then()
    // console.log('body:', JSON.parse(body).latest_posts);
});


const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));
