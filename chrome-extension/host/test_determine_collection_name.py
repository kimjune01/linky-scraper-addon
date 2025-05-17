import unittest
from determine_collection_name import determine_collection_name


class TestDetermineCollectionName(unittest.TestCase):
    def test_linkedin_profile(self):
        url = "https://linkedin.com/in/kimjune01/"
        self.assertEqual(determine_collection_name(url), "linkedin_profiles")

    def test_github_repo(self):
        url = "https://github.com/user/repo"
        self.assertEqual(determine_collection_name(url), "github_repositories")

    def test_jobs_ashbyhq(self):
        url = (
            "https://jobs.ashbyhq.com/cloudtrucks/f0343129-4cb4-4615-98ac-f037bc1813f9"
        )
        result = determine_collection_name(url)
        self.assertIn("ashbyhq", result)
        self.assertIn("jobs", result)
        # Optionally, check for a more specific format if you want
        # self.assertEqual(result, "ashbyhq_pages")

    def test_subdomain(self):
        url = "https://blog.example.com/article/123"
        result = determine_collection_name(url)
        self.assertIn("example", result)
        self.assertIn("blog", result)

    def test_default_case(self):
        url = "https://randomsite.xyz/some/path"
        result = determine_collection_name(url)
        self.assertIn("randomsite", result)


if __name__ == "__main__":
    unittest.main()
