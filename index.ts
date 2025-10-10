import express, { Express } from "express";
import routes from "./routes/index.route"

const app: Express = express()
const port: number = 4000

app.use("/", routes)

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})