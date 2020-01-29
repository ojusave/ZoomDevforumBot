let request = require('request');
const dialogflow = require('dialogflow');
const uuid = require('uuid');
const {GoogleAuth} = require('google-auth-library');

async function dialogflow_req(query_text) {
    // A unique identifier for the given session
    const sessionId = uuid.v4();
    // getProjectId()
    let projectId = 'dialogflow-project-id';
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
    const result = responses[0].queryResult;
    let response = ''
    for(let i in result.fulfillmentMessages){
        response += result.fulfillmentMessages[i].text.text[0] + "\n\n"
    }
    return response
}


function bot_run(){
// get the lastest post from devforum
    request('discourse-link-for-latest-posts', function (error, response, body) {
        let latest_posts = JSON.parse(body).latest_posts;
        let topics = new Set();
        let categories = new Set([8])
        let post
        for (post in latest_posts) {
            if (!topics.has(latest_posts[post].topic_id)) {
                topics.add(latest_posts[post].topic_id);
                if (latest_posts[post].post_number == 1 &&
                    categories.has(latest_posts[post].category_id)) {
                    // send request to dialogflow
                    let topic_id = latest_posts[post].topic_id
                    let query = (latest_posts[post].cooked.length > 256) ? latest_posts[post].topic_title : latest_posts[post].cooked;
                    let category_id = latest_posts[post].category_id
                    let query_text = "topic_id: " + topic_id + ",category_id: " + category_id + ",topic_title: " + query;
                    console.log("Query: " + query_text);
                    dialogflow_req(query_text).then(function (response) {
                        // response to devforum
                        console.log(` Dialogflow Response : ${response}`)
                        let response_options = {
                            'method': 'POST',
                            'url': 'discourse-link-for-latest-posts',
                            'headers': {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Api-Key': 'your discourse api key',
                                'Api-Username': "your-discourse-api-key"
                            },
                            formData: {
                                'topic_id': topic_id,
                                'raw': response
                            }
                        };
                        request(response_options, function (error, response) {
                            console.log(response.statusCode)
                            // console.log(response)
                            // if (error) {
                            //     console.log(error)
                            // }
                        })
                    })
                }
            }
        }
    });
    // console.log("Attempting again")
    // bot_run()
}

bot_run()


