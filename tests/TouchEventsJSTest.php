<?php

/*
 * Touch Events JS package for Bear Framework
 * https://github.com/ivopetkov/touch-events-js-bearframework-addon
 * Copyright (c) Ivo Petkov
 * Free to use under the MIT license.
 */

/**
 * @runTestsInSeparateProcesses
 */
class TouchEventsJSTest extends BearFramework\AddonTests\PHPUnitTestCase
{

    /**
     * 
     */
    public function testOutput()
    {
        $app = $this->getApp();

        $html = '<html><head><link rel="client-packages-embed" name="touchEvents"></head></html>';
        $result = $app->clientPackages->process($html);

        $this->assertTrue(strpos($result, 'ivoPetkov.bearFrameworkAddons.touchEvents') !== false);
    }
}
