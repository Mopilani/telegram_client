library telegram_client;

import 'dart:convert' as convert;
import 'dart:ffi' as ffi;
import 'package:ffi/ffi.dart' as pkgffi;
import 'package:http/http.dart';
import 'package:eventify/eventify.dart';
import 'package:uuid/uuid.dart' as uuid;
import 'dart:async';
import 'package:hexaminate/hexaminate.dart';

part 'src/request.dart';
part 'src/telegram.dart';
part 'tdlib/tdlib.dart';
