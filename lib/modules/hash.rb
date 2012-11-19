# http://qugstart.com/blog/uncategorized/ruby-multi-level-nested-hash-value/
# user_hash.hash_val(:extra, :birthday, :year) => 1951
class ::Hash

  # http://stackoverflow.com/a/9381776
  def deep_merge(second)
    merger = proc { |key, v1, v2| Hash === v1 && Hash === v2 ? v1.merge(v2, &merger) : v2 }
    self.merge(second, &merger)
  end
end