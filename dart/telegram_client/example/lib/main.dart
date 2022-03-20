import 'core/lib.dart';

var path = Directory.current.path;
var option = {
  'api_id': 1917085,
  'api_hash': 'a612212e6ac3ff1f97a99b2e0f050894',
  'database_directory': "$path/bot",
  'files_directory': "$path/bot",
};
Tdlib tg =
    Tdlib("/home/azkadev/Downloads/azkauserrobot-1.0.1/libtdjson.so", option);

void main() async {
  runApp(
    MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: MyHomePage(title: 'Flutter Demo Home Page', tg: tg),
    ),
  );
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({Key? key, required this.title, required this.tg})
      : super(key: key);
  final Tdlib tg;
  final String title;
  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;
  String text = "hellow rold";

  void _incrementCounter() {
    setState(() {
      // This call to setState tells the Flutter framework that something has
      // changed in this State, which causes it to rerun the build method below
      // so that the display can reflect the updated values. If we changed
      // _counter without calling setState(), then the build method would not be
      // called again, and so nothing would appear to happen.
      _counter++;
    });
  }

  @override
  void initState() async {
    super.initState();
    ReceivePort port = ReceivePort();
    await Isolate.spawn(telegram, port.sendPort);

    port.listen((update_td) async {
      UpdateTd update = update_td;
      print(update.update);
      if (update.update["@type"] == "updateNewMessage" &&
          update.update["message"]["@type"] == "message") {
        var msg = update.update["message"];
        var chatId = msg["chat_id"];
        if (!msg["is_outgoing"]) {
          
        }
      }
    });
  }

  void telegram(SendPort sendPort) async {
    tg.on("update", (UpdateTd update) async {
      sendPort.send(update);
      if (update.update["@type"] == "updateNewMessage" &&
          update.update["message"]["@type"] == "message") {
        var msg = update.update["message"];
        var chatId = msg["chat_id"];
        if (!msg["is_outgoing"]) {
          return await update.tg.request(
              "sendMessage", {"chat_id": chatId, "text": "Hello world"});
        }
      }
    });
    await tg.bot("2123043767:AAEY0KTdVYo0JTRmFF5S4QPBnvoCdpe2yPI");
  }

  @override
  Widget build(BuildContext context) {
    // This method is rerun every time setState is called, for instance as done
    // by the _incrementCounter method above.
    //
    // The Flutter framework has been optimized to make rerunning build methods
    // fast, so that you can just rebuild anything that needs updating rather
    // than having to individually change instances of widgets.
    return Scaffold(
      appBar: AppBar(
        // Here we take the value from the MyHomePage object that was created by
        // the App.build method, and use it to set our appbar title.
        title: Text(widget.title),
      ),
      body: Center(
        // Center is a layout widget. It takes a single child and positions it
        // in the middle of the parent.
        child: Column(
          // Column is also a layout widget. It takes a list of children and
          // arranges them vertically. By default, it sizes itself to fit its
          // children horizontally, and tries to be as tall as its parent.
          //
          // Invoke "debug painting" (press "p" in the console, choose the
          // "Toggle Debug Paint" action from the Flutter Inspector in Android
          // Studio, or the "Toggle Debug Paint" command in Visual Studio Code)
          // to see the wireframe for each widget.
          //
          // Column has various properties to control how it sizes itself and
          // how it positions its children. Here we use mainAxisAlignment to
          // center the children vertically; the main axis here is the vertical
          // axis because Columns are vertical (the cross axis would be
          // horizontal).
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'You have pushed the button this many times:',
            ),
            Text(
              text,
              style: Theme.of(context).textTheme.headline4,
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headline4,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ), // This trailing comma makes auto-formatting nicer for build methods.
    );
  }
}
