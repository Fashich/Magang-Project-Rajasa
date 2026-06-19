<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Core;

use FastRoute\Dispatcher;
use Psr\Container\ContainerInterface;

final class RouteDispatcher
{
    public function __construct(
        private readonly Dispatcher $dispatcher,
        private readonly ContainerInterface $container
    ) {
    }

    public function dispatch(Request $request): void
    {
        $routeInfo = $this->dispatcher->dispatch($request->method(), $request->uri());

        switch ($routeInfo[0]) {
            case Dispatcher::NOT_FOUND:
                throw new HttpException('Endpoint tidak ditemukan.', 404);

            case Dispatcher::METHOD_NOT_ALLOWED:
                throw new HttpException('Method tidak diizinkan.', 405);

            case Dispatcher::FOUND:
                $this->callHandler($routeInfo[1], $routeInfo[2]);
                return;
        }
    }

    private function callHandler(mixed $handler, array $vars = []): void
    {
        if (is_string($handler)) {
            $controller = $this->container->get($handler);
            $controller(...array_values($vars));
            return;
        }

        if (is_callable($handler)) {
            $handler(...array_values($vars));
            return;
        }

        throw new HttpException('Handler route tidak valid.', 500);
    }
}