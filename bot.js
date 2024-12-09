const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { format } = require('date-fns');
const dotenv = require('dotenv');
const cheerio = require('cheerio');

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));
  const data = req.body;

  if (data.message) {
    const chat_id = data.message.chat.id;
    const text = data.message.text;

    if (text === '/get') {
      const formattedDate = format(new Date(), 'd-MMMM-yyyy').toLowerCase();

      fetch(`https://www.quiknotes.in/tapswap-daily-task-cinema-codes-${formattedDate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.text())
      .then(body => {
        const $ = cheerio.load(body);
        const content = $.text();
        const startText = "coins today:";
        const endText = "Get All Code:";
        const startIndex = content.indexOf(startText);
        const endIndex = content.indexOf(endText);
        if (startIndex !== -1 && endIndex !== -1) {
          const result = content.substring(startIndex + startText.length, endIndex).trim();
          sendRequest(chat_id, `Result: ${result}`)
            .then(() => {
              res.status(200).send('Result sent');
            })
            .catch((error) => {
              console.error('Error sending result:', error);
              res.status(500).send(`Error sending result: ${error.message}`);
            });
        } else {
          sendRequest(chat_id, 'Error: Could not find the specified text.')
            .then(() => {
              res.status(200).send('Error message sent');
            })
            .catch((error) => {
              console.error('Error sending error message:', error);
              res.status(500).send(`Error sending error message: ${error.message}`);
            });
        }
      })
      .catch(error => {
        sendRequest(chat_id, `Error: ${error.message}`)
          .then(() => {
            res.status(200).send('Error message sent');
          })
          .catch((error) => {
            console.error('Error sending error message:', error);
            res.status(500).send(`Error sending error message: ${error.message}`);
          });
      });
    } else {
      const messageJson = `از هر جایی میتونی پیام باز ارسال کنی و اطلاعاتش رو بگیری \n برای دیدن سورس من هم دستور source/ رو بفرست \n اینم اطلاعات پیام شما \n \`\`\`\n${JSON.stringify(data.message, null, 2)}\n\`\`\``;

      sendRequest(chat_id, messageJson)
        .then(() => {
          res.status(200).send('Message sent');
        })
        .catch((error) => {
          console.error('Error sending message:', error);
          res.status(500).send(`Error sending message: ${error.message}`);
        });
    }
  } else {
    res.status(200).send('No message received');
  }
});

app.get('/', (req, res) => {
  res.send('Server is running and ready!');
});

async function sendRequest(chat_id, messageJson) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chat_id,
        text: messageJson,
        parse_mode: 'Markdown'
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
