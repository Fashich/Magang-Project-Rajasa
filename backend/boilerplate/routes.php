<?php

declare(strict_types=1);

use FastRoute\RouteCollector;
use function FastRoute\simpleDispatcher;

return simpleDispatcher(function (RouteCollector $route): void {
    $apiRoutes = require __DIR__ . '/../routes/api.php';
    $apiRoutes($route);
});