<?php

declare(strict_types=1);

use DI\ContainerBuilder;
use Rajasa\PresensiSiswa\Core\Request;

return function (): \Psr\Container\ContainerInterface {
    $builder = new ContainerBuilder();

    $builder->useAutowiring(true);

    $builder->addDefinitions([
        Request::class => fn () => new Request(),
    ]);

    return $builder->build();
};