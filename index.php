<?php

/*
 * Touch Events JS package for Bear Framework
 * https://github.com/ivopetkov/touch-events-js-bearframework-addon
 * Copyright (c) Ivo Petkov
 * Free to use under the MIT license.
 */

use \BearFramework\App;

$app = App::get();
$context = $app->contexts->get(__DIR__);

$app->clientPackages
    ->add('touchEvents', function (IvoPetkov\BearFrameworkAddons\ClientPackage $package) use ($context) {
        $package->addJSCode(include $context->dir . '/assets/touchEvents.min.js.php');
        //$package->addJSCode(file_get_contents($context->dir . '/dev/touchEvents.js'));
        $package->get = 'return ivoPetkov.bearFrameworkAddons.touchEvents';
    });
