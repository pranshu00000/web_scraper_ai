<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    protected $fillable = ['title', 'content', 'url', 'is_updated', 'updated_content', 'citations'];

    protected $casts = [
        'is_updated' => 'boolean',
        'citations' => 'array',
    ];
}
