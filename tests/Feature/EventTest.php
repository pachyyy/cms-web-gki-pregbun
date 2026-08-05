<?php

use App\Models\Event;
use App\Models\User;

function baseEventPayload(array $overrides = []): array
{
    return array_merge([
        'title' => 'Contoh Kegiatan',
        'location' => 'Gedung Gereja',
        'description' => 'Deskripsi kegiatan.',
        'category' => 'ibadah',
    ], $overrides);
}

test('storing a mingguan event persists day and start_time, leaves event_date null', function () {
    $this->actingAs(User::factory()->create());

    $this->post('/event', baseEventPayload([
        'type' => 'mingguan',
        'day' => 'Senin',
        'start_time' => '08:00',
    ]))->assertSessionDoesntHaveErrors();

    $event = Event::sole();
    expect($event->type)->toBe('mingguan');
    expect($event->day)->toBe('Senin');
    expect($event->start_time)->toBe('08:00');
    expect($event->event_date)->toBeNull();
});

test('storing a spesial event persists event_date, leaves day null', function () {
    $this->actingAs(User::factory()->create());

    $this->post('/event', baseEventPayload([
        'type' => 'spesial',
        'event_date' => '2026-12-25',
        'start_time' => '10:00',
    ]))->assertSessionDoesntHaveErrors();

    $event = Event::sole();
    expect($event->type)->toBe('spesial');
    expect($event->event_date->format('Y-m-d'))->toBe('2026-12-25');
    expect($event->day)->toBeNull();
});

test('storing a mingguan event without a day fails validation', function () {
    $this->actingAs(User::factory()->create());

    $this->post('/event', baseEventPayload([
        'type' => 'mingguan',
        'start_time' => '08:00',
    ]))->assertSessionHasErrors(['day' => 'Hari wajib dipilih untuk kegiatan rutin mingguan.']);

    expect(Event::count())->toBe(0);
});

test('an end_time not after start_time fails validation', function () {
    $this->actingAs(User::factory()->create());

    $this->post('/event', baseEventPayload([
        'type' => 'mingguan',
        'day' => 'Senin',
        'start_time' => '10:00',
        'end_time' => '09:00',
    ]))->assertSessionHasErrors(['end_time' => 'Jam selesai harus lebih besar dari jam mulai.']);

    expect(Event::count())->toBe(0);
});

test('updating a spesial event with a stale day in the payload does not stamp it as mingguan', function () {
    $this->actingAs(User::factory()->create());

    $event = Event::create([
        'title' => 'Kebaktian Paskah',
        'type' => 'spesial',
        'event_date' => '2026-04-05',
        'start_time' => '10:00',
        'location' => 'Gedung Gereja',
        'description' => 'Deskripsi',
        'category' => 'khusus',
    ]);

    // Mirrors the fixed frontend bug: a spesial row must never submit `day`,
    // but the server independently guards against a payload that does.
    $this->put("/event/{$event->id}", baseEventPayload([
        'title' => 'Kebaktian Paskah (updated)',
        'type' => 'spesial',
        'event_date' => '2026-04-05',
        'start_time' => '10:00',
        'day' => 'Senin',
    ]))->assertSessionDoesntHaveErrors();

    $event->refresh();
    expect($event->type)->toBe('spesial');
    expect($event->day)->toBeNull();
    expect($event->event_date->format('Y-m-d'))->toBe('2026-04-05');
});

test('Event::ordered sorts mingguan by week order then spesial by date', function () {
    $sabtu = Event::create(baseEventPayload(['title' => 'Sabtu', 'type' => 'mingguan', 'day' => 'Sabtu', 'start_time' => '06:00']));
    $senin = Event::create(baseEventPayload(['title' => 'Senin', 'type' => 'mingguan', 'day' => 'Senin', 'start_time' => '18:00']));
    $spesialLater = Event::create(baseEventPayload(['title' => 'Spesial Nanti', 'type' => 'spesial', 'event_date' => '2026-12-25', 'start_time' => '10:00']));
    $spesialSooner = Event::create(baseEventPayload(['title' => 'Spesial Duluan', 'type' => 'spesial', 'event_date' => '2026-08-17', 'start_time' => '12:00']));

    expect(Event::ordered()->pluck('id')->all())->toBe([
        $senin->id, $sabtu->id, $spesialSooner->id, $spesialLater->id,
    ]);
});
